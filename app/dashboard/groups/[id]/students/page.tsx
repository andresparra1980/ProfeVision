"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search, X, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ExcelImport } from "@/components/students/excel-import";

export default function GroupStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
    fetchGroupStudents();
  }, [groupId]);

  async function fetchGroupDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("grupos")
        .select("*, materias(nombre)")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error("Error fetching group details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del grupo",
        variant: "destructive",
      });
      router.push("/dashboard/groups");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroupStudents() {
    try {
      const { data, error } = await supabase
        .from("estudiante_grupo")
        .select("*, estudiantes(*)")
        .eq("grupo_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Format data to display student information directly
      const formattedData = data.map(item => ({
        id: item.id,
        estudiante_id: item.estudiante_id,
        nombre_completo: item.estudiantes.nombre_completo,
        identificacion: item.estudiantes.identificacion,
        email: item.estudiantes.email,
      }));
      
      setGroupStudents(formattedData);
    } catch (error) {
      console.error("Error fetching group students:", error);
      toast({
        title: "Error",
        description: "Could not load students for this group",
        variant: "destructive",
      });
    }
  }

  async function searchStudents() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .or(`nombre_completo.ilike.%${searchQuery}%,identificacion.ilike.%${searchQuery}%`)
        .order("nombre_completo", { ascending: true })
        .limit(10);

      if (error) throw error;
      
      // Filter students that are already in the group
      const studentIds = groupStudents.map(s => s.estudiante_id);
      const filteredResults = data.filter(student => !studentIds.includes(student.id));
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching students:", error);
      toast({
        title: "Error",
        description: "Could not search for students",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function addStudentToGroup(studentId: string) {
    try {
      setIsAdding(true);
      const { error } = await supabase
        .from("estudiante_grupo")
        .insert({
          estudiante_id: studentId,
          grupo_id: groupId,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Este estudiante ya está en el grupo",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "¡Éxito!",
        description: "Estudiante agregado al grupo correctamente",
        variant: "default",
      });

      fetchGroupStudents();
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding student to group:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el estudiante al grupo",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function removeStudentFromGroup(estudiante_grupo_id: string) {
    try {
      const { error } = await supabase
        .from("estudiante_grupo")
        .delete()
        .eq("id", estudiante_grupo_id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Estudiante eliminado del grupo correctamente",
        variant: "default",
      });

      setGroupStudents(prev => prev.filter(student => student.id !== estudiante_grupo_id));
    } catch (error) {
      console.error("Error removing student from group:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante del grupo",
        variant: "destructive",
      });
    }
  }

  // Function to handle import completion
  const handleImportComplete = async () => {
    try {
      toast({
        title: "¡Éxito!",
        description: "Algunos estudiantes ya estaban en el grupo",
        variant: "default",
      });
      
      fetchGroupStudents();
    } catch (error) {
      console.error("Error adding imported students to group:", error);
      toast({
        title: "Error",
        description: "No se pudieron agregar los estudiantes importados al grupo",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-8">
        <p>No se encontró el grupo solicitado.</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/groups")}
        >
          Volver a Grupos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/dashboard/groups")}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Grupos
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{group.nombre}</h2>
        <p className="text-muted-foreground">
          {group.materias?.nombre} | {group.periodo_escolar || group.año_escolar || "Sin período escolar"}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Estudiantes del Grupo</CardTitle>
            <CardDescription>
              {groupStudents.length} estudiantes registrados en este grupo
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar desde Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Importar Estudiantes desde Excel</DialogTitle>
                  <DialogDescription>
                    Importa estudiantes desde un archivo Excel y serán agregados automáticamente a este grupo
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <ExcelImport onImportComplete={handleImportComplete} groupId={groupId} />
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Agregar Existente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agregar Estudiantes Existentes</DialogTitle>
                  <DialogDescription>
                    Busca y agrega estudiantes ya registrados en el sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar por nombre o identificación..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button disabled={isSearching} onClick={searchStudents}>
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Buscar</span>
                    </Button>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="mt-4 overflow-y-auto max-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Identificación</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.nombre_completo}</TableCell>
                              <TableCell>{student.identificacion}</TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  disabled={isAdding}
                                  onClick={() => addStudentToGroup(student.id)}
                                >
                                  Agregar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : searchQuery ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No se encontraron estudiantes con ese criterio de búsqueda
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {groupStudents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                No hay estudiantes en este grupo
              </p>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar Existente
                </Button>
                <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar desde Excel
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nombre_completo}</TableCell>
                      <TableCell>{student.identificacion}</TableCell>
                      <TableCell>{student.email || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStudentFromGroup(student.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Eliminar estudiante</span>
                        </Button>
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