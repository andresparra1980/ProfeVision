"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
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
        .select("*, materias(nombre)")
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
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Borrador</span>;
      case "publicado":
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Publicado</span>;
      case "cerrado":
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Cerrado</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  const handleExamClick = (examId: string) => {
    router.push(`/dashboard/exams/${examId}/edit`);
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
                      <TableCell>{getStatusBadge(exam.estado)}</TableCell>
                      <TableCell>{exam.duracion} min</TableCell>
                      <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/edit`)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Clock className="h-4 w-4" />
                            <span className="sr-only">Programar aplicación</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Calificar</span>
                          </Button>
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