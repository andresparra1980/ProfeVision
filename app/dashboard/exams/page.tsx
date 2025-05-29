"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { Upload, Plus } from "lucide-react"; // Added for page header buttons
import ImportExamDialog from "./components/ImportExamDialog";
import ExamsTableDesktop from "./components/ExamsTableDesktop";
import ExamsTableMobile from "./components/ExamsTableMobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuroraText } from "@/components/magicui/aurora-text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Added for dialogs

// Define a simple useMediaQuery hook
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Asegurarse de que window está definido (para SSR/SSG)
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

interface Exam {
  id: string;
  titulo: string;
  descripcion?: string | null;
  estado: string;
  duracion_minutos: number;
  created_at: string;
  materias: {
    nombre: string;
  };
  examen_grupo: Array<{
    grupo: {
      id: string;
      nombre: string;
    };
    fecha_aplicacion: string;
    estado: string;
  }>;
}

interface ImportResult {
  total_preguntas: number;
  preguntas: Array<{
    numero: number;
    pregunta: string;
    opciones: {
      a: string;
      b: string;
      c?: string;
      d?: string;
    };
    respuesta_correcta: string | null;
  }>;
}

export default function ExamsPage() {
  const router = useRouter();
  const [rawExams, setRawExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint (Tailwind)

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select(`
          *,
          materias(nombre),
          examen_grupo(
            grupo:grupo_id(id, nombre),
            fecha_aplicacion,
            estado
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRawExams(data || []);
    } catch (error) {
      const err = error as AuthError | Error;
      const code = 'code' in err ? err.code : undefined;
      const details = 'details' in err ? err.details : undefined;
      const status = err instanceof AuthError ? err.status : undefined;

      logger.error("[ExamsPage] Error fetching exams:", {
        message: err.message,
        status: status,
        code: code,
        details: details,
        errorObject: err
      });
      toast.error(`Error al cargar exámenes${status ? ` (Código: ${status})` : ''}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const filteredExams = rawExams.filter((exam) =>
    exam.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.descripcion && exam.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (exam.materias?.nombre && exam.materias.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  const handleExamClick = (examId: string) => {
    router.push(`/dashboard/exams/${examId}/edit`);
  };

  const handleOpenDeleteDialog = (examId: string) => {
    setExamToDelete(examId);
    setShowDeleteDialog(true);
  };

  const confirmAndDeleteExam = async (examId: string) => {
    // 1. Delete from examen_grupo_preguntas_respuestas (if applicable, direct relation might not exist)
    // This step might be complex depending on schema, assuming examen_grupo_preguntas is the link
    const { data: egpDataForResp, error: egpErrorSelectForResp } = await supabase
      .from('examen_grupo_preguntas')
      .select('id')
      .eq('examen_id', examId);

    if (egpErrorSelectForResp) {
      throw new Error(`Error selecting examen_grupo_preguntas for responses: ${egpErrorSelectForResp.message}`);
    }

    if (egpDataForResp && egpDataForResp.length > 0) {
      const egpIds = egpDataForResp.map((item: { id: string }) => item.id);
      // Assuming a direct link from examen_grupo_preguntas_respuestas to examen_grupo_preguntas.id
      // If not, this part needs adjustment based on actual schema for student responses.
      const { error: egprError } = await supabase
        .from('examen_grupo_preguntas_respuestas') // This table might be named differently or structured via examen_aplicacion_id
        .delete()
        .in('examen_grupo_pregunta_id', egpIds); // This foreign key needs to be correct
      if (egprError) {
        logger.warn(`Warning deleting examen_grupo_preguntas_respuestas (might be normal if no responses yet): ${egprError.message}`);
      }
    }

    // 2. Delete from examen_grupo_preguntas
    const { error: egpError } = await supabase
      .from('examen_grupo_preguntas')
      .delete()
      .eq('examen_id', examId);
    if (egpError) {
      logger.warn(`Warning deleting examen_grupo_preguntas (might be normal if not configured for groups): ${egpError.message}`);
    }

    // 3. Delete from examen_grupo
    const { error: egError } = await supabase
      .from("examen_grupo")
      .delete()
      .eq("examen_id", examId);
    if (egError) {
      logger.warn(`Warning deleting examen_grupo (might be normal if not assigned to groups): ${egError.message}`);
    }

    // 4. Delete from opciones_respuesta (via preguntas)
    const { data: preguntasData, error: preguntasError } = await supabase
      .from("preguntas")
      .select("id")
      .eq("examen_id", examId);

    if (preguntasError) throw new Error(`Error fetching preguntas for deleting opciones: ${preguntasError.message}`);

    if (preguntasData && preguntasData.length > 0) {
      const preguntaIds = preguntasData.map((p: { id: string }) => p.id);
      const { error: opcionesError } = await supabase
        .from("opciones_respuesta")
        .delete()
        .in("pregunta_id", preguntaIds);
      if (opcionesError) throw new Error(`Error deleting opciones_respuesta: ${opcionesError.message}`);
    }

    // 5. Delete from preguntas
    const { error: preguntasDelError } = await supabase
      .from("preguntas")
      .delete()
      .eq("examen_id", examId);
    if (preguntasDelError) throw new Error(`Error deleting preguntas: ${preguntasDelError.message}`);

    // 6. Delete from examenes
    const { error: examError } = await supabase
      .from("examenes")
      .delete()
      .eq("id", examId);
    if (examError) throw new Error(`Error deleting exam: ${examError.message}`);

    fetchExams(); // Re-fetch exams after deletion
  };

  const handleCreateExam = () => {
    router.push("/dashboard/exams/create-with-ai");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
        <AuroraText className="text-2xl font-bold tracking-tight">
            Exámenes
        </AuroraText>
          <p className="text-muted-foreground">Gestiona y crea exámenes para tus estudiantes.</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button onClick={() => setShowImportDialog(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
            <Upload className="mr-2 h-4 w-4" />
            Importar Examen
          </Button>
          <Button onClick={handleCreateExam} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Crear Examen con IA
          </Button>
        </div>
      </div>

      {isDesktop ? (
        <ExamsTableDesktop
          filteredExams={filteredExams}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleExamClick={handleExamClick}
          onOpenDeleteDialog={handleOpenDeleteDialog}
        />
      ) : (
        <ExamsTableMobile
          filteredExams={filteredExams}
          loading={loading}
          onOpenDeleteDialog={handleOpenDeleteDialog}
          setShowImportDialog={setShowImportDialog}
          handleCreateExam={handleCreateExam}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <ImportExamDialog
        _open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={(examData: ImportResult & { importId: string }) => {
          router.push(`/dashboard/exams/create?importId=${examData.importId}`);
        }}
      />

      {showDeleteDialog && examToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este examen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.promise(confirmAndDeleteExam(examToDelete), {
                    loading: "Eliminando examen...",
                    success: "Examen eliminado exitosamente.",
                    error: (err: Error) => err.message || "Error al eliminar el examen.",
                  });
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}


      {showCreateDialog && (
         <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Examen</DialogTitle>
              <DialogDescription>
                (Este diálogo sería para un formulario de creación directa, si es necesario)
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => {
              setShowCreateDialog(false);
              router.push("/dashboard/exams/create");
            }}>Ir a Crear</Button>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}