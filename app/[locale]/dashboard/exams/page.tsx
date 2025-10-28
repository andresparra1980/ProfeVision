'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { Upload, Plus } from "lucide-react"; // Added for page header buttons
import ImportExamDialog from "./components/ImportExamDialog";
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
import { useTranslations } from "next-intl";
import { TitleCardWithDepth } from "@/components/shared/title-card-with-depth";


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
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [rawExams, setRawExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select(
          `
          *,
          materias(nombre),
          examen_grupo(
            grupo:grupo_id(id, nombre),
            fecha_aplicacion,
            estado
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRawExams(data || []);
    } catch (error) {
      const err = error as AuthError | Error;
      const code = "code" in err ? err.code : undefined;
      const details = "details" in err ? err.details : undefined;
      const status = err instanceof AuthError ? err.status : undefined;

      logger.error("[ExamsPage] Error fetching exams:", {
        message: err.message,
        status: status,
        code: code,
        details: details,
        errorObject: err,
      });
      toast.error(
        `${t("exams.messages.loadingError")}${
          status ? ` (${t("common.error")}: ${status})` : ""
        }: ${err.message}`,
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const filteredExams = rawExams.filter(
    (exam) =>
      exam.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.descripcion &&
        exam.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exam.materias?.nombre &&
        exam.materias.nombre.toLowerCase().includes(searchQuery.toLowerCase())),
  );


  const handleOpenDeleteDialog = (examId: string) => {
    setExamToDelete(examId);
    setShowDeleteDialog(true);
  };

  const confirmAndDeleteExam = async (examId: string) => {
    // IMPORTANT: Student response deletion logic needs to be added here.
    // Please provide the correct table name for student responses and its relation to exams.
    /*
    // Example placeholder for student responses:
    const { error: studentResponsesError } = await supabase
      .from('TABLE_FOR_STUDENT_RESPONSES') // Replace with actual table name
      .delete()
      .eq('examen_id', examId); // Or link through pregunta_id, or another relevant foreign key
    if (studentResponsesError) {
      logger.error(`Error deleting student responses: ${studentResponsesError.message}`);
      // Consider if this should throw an error and stop the deletion process
      // throw new Error(`Error deleting student responses: ${studentResponsesError.message}`);
    }
    */

    // 1. Delete from examen_grupo (associations between exams and groups)
    const { error: egError } = await supabase
      .from("examen_grupo")
      .delete()
      .eq("examen_id", examId);
    if (egError) {
      logger.warn(
        `Warning or error deleting examen_grupo entries: ${egError.message}. This might be normal if the exam was not in any group.`,
      );
    }

    // 2. Delete from opciones_respuesta (answer options for questions)
    const { data: preguntasData, error: preguntasError } = await supabase
      .from("preguntas")
      .select("id")
      .eq("examen_id", examId);

    if (preguntasError) {
      logger.error(
        `Error fetching preguntas for deleting opciones: ${preguntasError.message}`,
      );
      throw new Error(
        `Error fetching preguntas for deleting opciones: ${preguntasError.message}`,
      );
    }

    if (preguntasData && preguntasData.length > 0) {
      const preguntaIds = preguntasData.map((p: { id: string }) => p.id);
      const { error: opcionesError } = await supabase
        .from("opciones_respuesta")
        .delete()
        .in("pregunta_id", preguntaIds);
      if (opcionesError) {
        logger.error(
          `Error deleting opciones_respuesta: ${opcionesError.message}`,
        );
        throw new Error(
          `Error deleting opciones_respuesta: ${opcionesError.message}`,
        );
      }
    }

    // 3. Delete from preguntas (questions belonging to the exam)
    const { error: preguntasDelError } = await supabase
      .from("preguntas")
      .delete()
      .eq("examen_id", examId);
    if (preguntasDelError) {
      logger.error(`Error deleting preguntas: ${preguntasDelError.message}`);
      throw new Error(`Error deleting preguntas: ${preguntasDelError.message}`);
    }

    // 4. Delete from other related tables if necessary (e.g., examen_asignaciones, examenes_favoritos)
    /*
    // Example for examen_asignaciones:
    const { error: asignacionesError } = await supabase
      .from('examen_asignaciones') // Replace with actual table name if it exists
      .delete()
      .eq('examen_id', examId);
    if (asignacionesError) {
       logger.warn(`Warning or error deleting examen_asignaciones: ${asignacionesError.message}`);
    }
    */

    /*
    // Example for examenes_favoritos:
    const { error: favoritosError } = await supabase
      .from('examenes_favoritos') // Replace with actual table name if it exists
      .delete()
      .eq('examen_id', examId);
    if (favoritosError) {
       logger.warn(`Warning or error deleting examenes_favoritos: ${favoritosError.message}`);
    }
    */

    // 5. Delete from examenes (the main exam record)
    const { error: examError } = await supabase
      .from("examenes")
      .delete()
      .eq("id", examId);
    if (examError) {
      logger.error(`Error deleting exam: ${examError.message}`);
      throw new Error(`Error deleting exam: ${examError.message}`);
    }

    fetchExams(); // Re-fetch exams after deletion
  };

  const handleCreateExam = () => {
    router.push("/dashboard/exams/ai-exams-creation-chat");
  };

  return (
    <div className="space-y-4">
      <TitleCardWithDepth
        title={
          <AuroraText className="text-4xl font-bold tracking-tight">
            {t("exams.title")}
          </AuroraText>
        }
        description={t("exams.description")}
        titleClassName="!text-4xl !mb-1.5"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowImportDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t("exams.import.actions.import")}
            </Button>
            <Button
              onClick={handleCreateExam}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("exams.actions.createWithAI")}
            </Button>
          </div>
        }
      />


        <ExamsTableMobile
          filteredExams={filteredExams}
          loading={loading}
          onOpenDeleteDialog={handleOpenDeleteDialog}
          setShowImportDialog={setShowImportDialog}
          handleCreateExam={handleCreateExam}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

      <ImportExamDialog
        _open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={(examData: ImportResult & { importId: string }) => {
          router.push({
            pathname: '/dashboard/exams/create',
            query: { importId: examData.importId },
          });
        }}
      />

      {showDeleteDialog && examToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("exams.delete.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("exams.delete.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                {t("exams.delete.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.promise(confirmAndDeleteExam(examToDelete), {
                    loading: t("exams.delete.loading"),
                    success: t("exams.delete.success"),
                    error: (err: Error) =>
                      err.message || t("exams.delete.error"),
                  });
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t("exams.delete.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("exams.create")}</DialogTitle>
              <DialogDescription>
                {t("exams.createDialog.description", { defaultValue: "(Este diálogo sería para un formulario de creación directa, si es necesario)" })}
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => {
                setShowCreateDialog(false);
                router.push("/dashboard/exams/create");
              }}
            >
              {t("exams.createDialog.goToCreate", { defaultValue: "Ir a Crear" })}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
