"use client";

import { FileText, Eye, Printer, Users, FileOutput, Trash2, Link, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// AlertDialog components are no longer used directly in this file
import { useRouter } from "next/navigation";
import React from "react";

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

interface ExamsTableDesktopProps {
  filteredExams: Exam[];
  searchQuery: string;
  setSearchQuery: (_query: string) => void;
  loading: boolean;
  onOpenDeleteDialog: (_examId: string) => void;
  _setShowCreateDialog?: (_show: boolean) => void; // Optional and prefixed as it might not be used
  handleExamClick: (_examId: string) => void;
}

export default function ExamsTableDesktop({
  filteredExams,
  searchQuery,
  setSearchQuery,
  loading,
  onOpenDeleteDialog,
  _setShowCreateDialog, // Prefixed as it's not used directly in this component's render
  handleExamClick,
}: ExamsTableDesktopProps) {
  const router = useRouter();

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

  return (
    <Card>
      <CardHeader>
        <div> {/* Container for title/desc and search */}
          <div> {/* Title/Desc block */}
            <CardTitle>Todos los Exámenes</CardTitle>
            <CardDescription>Lista de todos los exámenes creados.</CardDescription>
          </div>
          <div className="mt-4">
            <Input
              placeholder="Buscar examen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredExams.length === 0 && searchQuery ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No se encontraron exámenes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Intenta ajustar tu búsqueda.
            </p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No tienes exámenes creados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Empieza importando o creando tu primer examen desde las opciones en la parte superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Grupos Asignados</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam: Exam) => (
                  <TableRow key={exam.id} onClick={() => handleExamClick(exam.id)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{exam.titulo}</div>
                      <div className="text-xs text-muted-foreground">{exam.descripcion || "Sin descripción"}</div>
                    </TableCell>
                    <TableCell>{exam.materias?.nombre || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(exam.estado)}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.examen_grupo?.map((asignacion) => (
                            <span
                              key={asignacion.grupo.id}
                              className="inline-flex items-center justify-center rounded-full bg-secondary text-white px-2 py-1 text-xs font-medium shadow-sm text-center"
                            >
                              {asignacion.grupo.nombre}
                            </span>
                          ))}
                          {(!exam.examen_grupo || exam.examen_grupo.length === 0) && (
                            <span className="text-xs text-muted-foreground">Sin grupos asignados</span>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>{exam.duracion_minutos} min</TableCell>
                    <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/edit`); }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {exam.estado === "borrador" && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenDeleteDialog(exam.id); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/export`); }}
                              >
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Imprimir</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Imprimir</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/responses`); }}
                              >
                                <FileOutput className="h-4 w-4" />
                                <span className="sr-only">Generar Hojas de Respuesta</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generar Hojas de Respuesta</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/assign`); }}
                              >
                                <Users className="h-4 w-4" />
                                <span className="sr-only">Asignar Grupos</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Asignar Grupos</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/results`); }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver resultados</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver resultados</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/dashboard/exams/${exam.id}/link-grade-component`); }}
                              >
                                <Link className="h-4 w-4" />
                                <span className="sr-only">Vincular Componente</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Vincular a Componente de Nota</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
