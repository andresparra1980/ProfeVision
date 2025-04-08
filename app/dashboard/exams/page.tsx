"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Eye, Printer, Users, FileOutput, Trash2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
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
      setExams(data || []);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredExams = exams.filter((exam) =>
    exam.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.descripcion && exam.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (exam.materias?.nombre && exam.materias.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  const handleExamClick = (examId: string) => {
    router.push(`/dashboard/exams/${examId}/edit`);
  };

  const handleDelete = async (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autorizado');
      }

      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el examen');
      }

      toast.success('Examen eliminado correctamente');
      // Actualizar la lista de exámenes
      setExams(exams.filter(exam => exam.id !== examId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el examen');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exámenes</h2>
          <p className="text-muted-foreground">
            Crea, gestiona y califica exámenes para tus estudiantes
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/exams/create")}>
          <Plus className="mr-2 h-4 w-4" /> Crear Examen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Exámenes</CardTitle>
          <CardDescription>
            Lista de todos los exámenes creados
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Buscar examen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No hay exámenes disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead>Grupos Asignados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => (
                    <TableRow key={exam.id} className="cursor-pointer" onClick={() => handleExamClick(exam.id)}>
                      <TableCell className="font-medium">{exam.titulo}</TableCell>
                      <TableCell>{exam.materias?.nombre || "Sin materia"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.examen_grupo?.map((asignacion) => (
                            <span
                              key={asignacion.grupo.id}
                              className="inline-flex items-center rounded-full bg-secondary text-white px-2 py-1 text-xs font-medium shadow-sm"
                            >
                              {asignacion.grupo.nombre}
                            </span>
                          ))}
                          {(!exam.examen_grupo || exam.examen_grupo.length === 0) && (
                            <span className="text-xs text-muted-foreground">Sin grupos asignados</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.estado)}</TableCell>
                      <TableCell>{exam.duracion_minutos} min</TableCell>
                      <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/edit`)}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar examen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {exam.estado === 'borrador' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Eliminar</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el examen y todos sus elementos relacionados.
                                          Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={(e) => handleDelete(exam.id, e)}
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar examen</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/export`)}
                                >
                                  <Printer className="h-4 w-4" />
                                  <span className="sr-only">Exportar formatos</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Exportar hojas de preguntas</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/responses`)}
                                >
                                  <FileOutput className="h-4 w-4" />
                                  <span className="sr-only">Hojas de respuesta</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Generar hojas de respuesta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/assign`)}
                                >
                                  <Users className="h-4 w-4" />
                                  <span className="sr-only">Asignar grupos</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Asignar más grupos a este examen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/results`)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver resultados</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver resultados del examen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/dashboard/exams/${exam.id}/link-grade-component`)}
                                >
                                  <Link className="h-4 w-4" />
                                  <span className="sr-only">Vincular a Componente de Nota</span>
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
    </div>
  );
} 