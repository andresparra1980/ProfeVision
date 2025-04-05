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
        nombres: item.estudiantes.nombres,
        apellidos: item.estudiantes.apellidos,
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
        .or(`nombres.ilike.%${searchQuery}%,apellidos.ilike.%${searchQuery}%,identificacion.ilike.%${searchQuery}%`)
        .order("apellidos", { ascending: true })
        .order("nombres", { ascending: true })
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

  async function addStudentToGroup(student: any) {
    try {
      setIsAdding(true);
      const { error } = await supabase.rpc('crear_estudiante_en_grupo', {
        p_nombres: student.nombres,
        p_apellidos: student.apellidos,
        p_identificacion: student.identificacion,
        p_email: student.email,
        p_grupo_id: groupId
      });

      if (error) throw error;

      // Refresh the list
      fetchGroupStudents();
      setSearchQuery("");
      setSearchResults([]);
      
      toast({
        title: "Estudiante agregado",
        description: "El estudiante ha sido agregado al grupo exitosamente",
      });
    } catch (error: any) {
      console.error("Error adding student to group:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el estudiante al grupo",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function removeStudentFromGroup(studentId: string) {
    try {
      const { error } = await supabase
        .from("estudiante_grupo")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      // Refresh the list
      fetchGroupStudents();
      
      toast({
        title: "Estudiante removido",
        description: "El estudiante ha sido removido del grupo exitosamente",
      });
    } catch (error) {
      console.error("Error removing student from group:", error);
      toast({
        title: "Error",
        description: "No se pudo remover el estudiante del grupo",
        variant: "destructive",
      });
    }
  }

  // Function to handle import completion
  const handleImportComplete = async () => {
    try {
      toast({
        title: "¡Éxito!",
        description: "Los estudiantes han sido importados exitosamente",
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
                  <Plus className="mr-2 h-4 w-4" /> Agregar Estudiante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buscar Estudiante</DialogTitle>
                  <DialogDescription>
                    Busca un estudiante por nombre o identificación para agregarlo al grupo
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar por nombre o identificación..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => searchStudents()}
                      disabled={isSearching}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <p className="font-medium">{student.nombres} {student.apellidos}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.identificacion}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addStudentToGroup(student)}
                            disabled={isAdding}
                          >
                            Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <p className="text-center text-muted-foreground py-4">
                      No se encontraron estudiantes
                    </p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.identificacion}</TableCell>
                      <TableCell>{student.nombres}</TableCell>
                      <TableCell>{student.apellidos}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStudentFromGroup(student.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 