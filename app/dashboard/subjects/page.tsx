"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEntities, setHasEntities] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkEntities();
    fetchSubjects();
  }, []);

  async function checkEntities() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Verificar si el profesor tiene entidades educativas asociadas
      const { data, error } = await supabase
        .from("profesor_entidad")
        .select("id")
        .eq("profesor_id", session.user.id);

      if (error) {
        console.error("Error al verificar entidades:", error);
        return;
      }

      // Si no tiene entidades, setHasEntities será false
      setHasEntities(data && data.length > 0);
    } catch (error) {
      console.error("Error inesperado al verificar entidades:", error);
    }
  }

  async function fetchSubjects() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("materias")
        .select("*, entidades_educativas(nombre)")
        .eq("profesor_id", session.user.id)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar materias:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las materias",
          variant: "destructive",
        });
        return;
      }
      setSubjects(data || []);
    } catch (error) {
      console.error("Error inesperado al cargar materias:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar las materias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredSubjects = subjects.filter((subject) =>
    subject.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.descripcion && subject.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (subject.entidades_educativas?.nombre && subject.entidades_educativas.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const deleteSubject = async (id: string) => {
    try {
      // Verificar si la materia tiene exámenes asociados
      const { data: exams, error: examsError } = await supabase
        .from("examenes")
        .select("id")
        .eq("materia_id", id);

      if (examsError) throw examsError;

      if (exams && exams.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar la materia porque tiene exámenes asociados",
          variant: "destructive",
        });
        return;
      }

      // Verificar si la materia tiene grupos asociados
      const { data: groups, error: groupsError } = await supabase
        .from("grupos")
        .select("id")
        .eq("materia_id", id);

      if (groupsError) throw groupsError;

      if (groups && groups.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar la materia porque tiene grupos asociados",
          variant: "destructive",
        });
        return;
      }

      // Eliminar la materia
      const { error } = await supabase
        .from("materias")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Materia eliminada correctamente",
      });

      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la materia",
        variant: "destructive",
      });
    }
  };

  // Si no hay entidades educativas, mostrar un mensaje y redirigir
  if (!loading && !hasEntities) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Materias</h2>
          <p className="text-muted-foreground">
            Administra las materias que impartes
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Entidad Educativa Requerida</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Debes crear o unirte a al menos una entidad educativa antes de poder crear materias. 
              Las materias deben estar asociadas a una entidad educativa.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/entities")}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Entidad Educativa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Materias</h2>
          <p className="text-muted-foreground">
            Administra las materias que impartes
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/subjects/create")}>
          <Plus className="mr-2 h-4 w-4" /> Crear Materia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Materias</CardTitle>
          <CardDescription>
            Lista de todas las materias creadas
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Buscar materia..."
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
          ) : filteredSubjects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No hay materias disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Entidad Educativa</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.nombre}</TableCell>
                      <TableCell>{subject.descripcion || "Sin descripción"}</TableCell>
                      <TableCell>{subject.entidades_educativas?.nombre || "Sin entidad"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/dashboard/subjects/${subject.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => deleteSubject(subject.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
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