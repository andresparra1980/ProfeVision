"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  Pencil,
  Trash2,
  Printer,
  FileOutput,
  Users,
  Timer,
  CalendarDays,
  Eye,
  Upload,
  Plus,
  FileText, // Kept for empty state
  Link
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Interface para los exámenes (idealmente, importar desde un archivo de tipos compartido)
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

interface ExamsTableMobileProps {
  filteredExams: Exam[];
  loading: boolean;
  onOpenDeleteDialog: (_examId: string) => void;
  setShowImportDialog: (_show: boolean) => void; 
  handleCreateExam: () => void;
  searchQuery: string;
  setSearchQuery: (_query: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "borrador":
      return <span className="rounded-full bg-accent text-accent-foreground px-2 py-1 text-xs font-medium shadow-sm">Borrador</span>;
    case "publicado":
      return <span className="rounded-full bg-primary text-primary-foreground px-2 py-1 text-xs font-medium shadow-sm">Publicado</span>;
    case "cerrado":
      return <span className="rounded-full bg-destructive text-destructive-foreground px-2 py-1 text-xs font-medium shadow-sm">Cerrado</span>;
    default:
      return <span className="rounded-full bg-muted text-muted-foreground px-2 py-1 text-xs font-medium shadow-sm">{status}</span>;
  }
};

const getStatusLedColorClass = (status: string): string => {
  switch (status) {
    case "borrador":
      return "bg-accent";
    case "publicado":
      return "bg-primary";
    case "cerrado":
      return "bg-destructive";
    default:
      return "bg-muted";
  }
};

export default function ExamsTableMobile({
  filteredExams,
  loading,
  onOpenDeleteDialog,
  setShowImportDialog,
  handleCreateExam,
  searchQuery,
  setSearchQuery,
}: ExamsTableMobileProps) {
  const router = useRouter();

  return (
    <div className="px-2 md:px-0 py-4 space-y-4">
      <Input
        placeholder="Buscar examen..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-card dark:bg-gray-800 border-accent placeholder:text-muted-foreground"
      />
      {loading ? (
        <div className="flex justify-center items-center h-64 p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-4 text-center space-y-4 mt-8">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/50" />
          {searchQuery ? (
            <div>
              <p className="text-xl font-semibold">No se encontraron exámenes</p>
              <p className="text-sm text-muted-foreground">
                Intenta con otra búsqueda o ajusta los filtros.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-semibold">No hay exámenes</p>
              <p className="text-sm text-muted-foreground">
                Aún no has creado o importado ningún examen.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
                <Button onClick={() => setShowImportDialog(true)} variant="outline" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Examen
                </Button>
                <Button onClick={handleCreateExam} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Examen
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredExams.map((exam) => (
            <AccordionItem value={exam.id} key={exam.id} className="border rounded-md shadow-sm bg-card">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex-1 text-left">
                  <h3 className="flex items-center font-medium text-base leading-tight text-card-foreground"><span className={`inline-block w-2.5 h-2.5 ${getStatusLedColorClass(exam.estado)} rounded-full mr-2`}></span>{exam.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{exam.materias?.nombre || 'Sin materia'}</p>
                  {exam.examen_grupo && exam.examen_grupo.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exam.examen_grupo.map((asignacion: Exam['examen_grupo'][number]) => (
                        <span
                          key={asignacion.grupo.id}
                          className="inline-flex items-center justify-center rounded-full bg-secondary text-white px-2 py-0.5 text-[10px] font-medium shadow-sm"
                        >
                          {asignacion.grupo.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t bg-muted/20">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    {getStatusBadge(exam.estado)}
                  </div>
                  <div className="flex items-center">
                    <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Duración:</span> 
                    <span>{exam.duracion_minutos} min</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Creado:</span> 
                    <span>{new Date(exam.created_at).toLocaleDateString()}</span>
                  </div>
                  <Separator decorative orientation="horizontal" style={{ margin: "15px 0" }} />
                  <div className="pt-2 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2" onClick={() => router.push(`/dashboard/exams/${exam.id}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    {exam.estado === "borrador" && (
                      <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-red-500 dark:text-red-400" onClick={() => onOpenDeleteDialog(exam.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2" onClick={() => router.push(`/dashboard/exams/${exam.id}/export`)}>
                      <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2" onClick={() => router.push(`/dashboard/exams/${exam.id}/responses`)}>
                      <FileOutput className="mr-2 h-4 w-4" /> Generar Hojas de Respuesta
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2" onClick={() => router.push(`/dashboard/exams/${exam.id}/assign`)}>
                      <Users className="mr-2 h-4 w-4" /> Asignar Grupos
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2" onClick={() => router.push(`/dashboard/exams/${exam.id}/link-grade-component`)}>
                      <Link className="mr-2 h-4 w-4" /> Vincular a Componente de Nota
                    </Button>
                    {exam.estado === "publicado" && (
                      <Button variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-purple-500 font-semibold" onClick={() => router.push(`/dashboard/exams/${exam.id}/results`) + "#results"}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Resultados
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
