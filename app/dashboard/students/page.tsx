"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, Users, RefreshCw, UserPlus, BookOpen, BookmarkPlus, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExcelImport } from "@/components/students/excel-import";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  nombre_completo: string;
  identificacion: string;
  email: string;
  grupo_id: string;
}

interface StudentDetails {
  id: string;
  grupos: Array<{
    id: string;
    nombre: string;
    materia: {
      nombre: string;
    };
  }>;
}

const initialFormData: FormData = {
  nombre_completo: '',
  identificacion: '',
  email: '',
  grupo_id: ''
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGroups, setHasGroups] = useState(false);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    checkForGroups();
    fetchStudents();
    loadGrupos();
  }, []);

  async function checkForGroups() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error, count } = await supabase
        .from("grupos")
        .select("*", { count: 'exact' })
        .eq("profesor_id", session.user.id)
        .limit(1);

      if (error) {
        console.error("Error al verificar grupos:", error);
        return;
      }

      setHasGroups(count !== null && count > 0);
    } catch (error) {
      console.error("Error al verificar grupos:", error);
    }
  }

  async function fetchStudents() {
    try {
      setLoading(true);
      console.log("Obteniendo estudiantes de la base de datos...");
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Obtener estudiantes que pertenecen a los grupos del profesor
      const { data, error } = await supabase
        .from("estudiante_grupo")
        .select(`
          estudiantes!inner(
            id, 
            nombre_completo, 
            identificacion, 
            email, 
            created_at
          ),
          grupos!inner(
            profesor_id
          )
        `)
        .eq("grupos.profesor_id", session.user.id)
        .order("created_at", { foreignTable: "estudiantes", ascending: false });

      if (error) {
        console.error("Error al consultar estudiantes:", error);
        throw error;
      }
      
      // Transformar los datos para obtener un formato más fácil de usar
      const formattedData = (data as any[]).map(item => ({
        id: item.estudiantes.id,
        nombre_completo: item.estudiantes.nombre_completo,
        identificacion: item.estudiantes.identificacion,
        email: item.estudiantes.email,
        created_at: item.estudiantes.created_at
      }));
      
      // Eliminar duplicados (un estudiante puede estar en múltiples grupos)
      const uniqueStudents = Array.from(
        new Map(formattedData.map(item => [item.id, item])).values()
      );
      
      console.log(`Se encontraron ${uniqueStudents.length} estudiantes en los grupos del profesor`);
      setStudents(uniqueStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadGrupos() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data, error } = await supabase
        .from("grupos")
        .select(`
          id,
          nombre,
          materias (
            nombre
          )
        `)
        .eq("profesor_id", session.user.id)
        .order("nombre");

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error("Error al cargar grupos:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.nombre_completo || !formData.identificacion || !formData.grupo_id) {
        setError('Por favor completa todos los campos requeridos');
        setIsSubmitting(false);
        return;
      }

      // Verificar que el grupo pertenece al profesor
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No hay sesión activa');
        setIsSubmitting(false);
        return;
      }

      const { data: grupoCheck, error: grupoError } = await supabase
        .from('grupos')
        .select('id')
        .eq('id', formData.grupo_id)
        .eq('profesor_id', session.user.id)
        .single();

      if (grupoError || !grupoCheck) {
        setError('No tienes permiso para agregar estudiantes a este grupo');
        setIsSubmitting(false);
        return;
      }

      // Crear el estudiante y asignarlo al grupo en una transacción usando RPC
      const { data: result, error: rpcError } = await supabase
        .rpc('crear_estudiante_en_grupo', {
          p_nombre_completo: formData.nombre_completo,
          p_identificacion: formData.identificacion,
          p_email: formData.email || null,
          p_grupo_id: formData.grupo_id
        });

      if (rpcError) {
        throw rpcError;
      }

      toast({
        title: "Estudiante creado",
        description: "El estudiante ha sido agregado exitosamente al grupo",
      });

      setIsOpen(false);
      setFormData(initialFormData);
      fetchStudents();

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Ocurrió un error al crear el estudiante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredStudents = students.filter((student) =>
    student.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.identificacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function fetchStudentDetails(studentId: string) {
    try {
      setLoadingDetails(true);
      
      const { data, error } = await supabase
        .from('estudiante_grupo')
        .select(`
          grupos!inner(
            id,
            nombre,
            materias!inner(
              nombre
            )
          )
        `)
        .eq('estudiante_id', studentId);

      if (error) throw error;

      setSelectedStudent({
        id: studentId,
        grupos: data.map((item: any) => ({
          id: item.grupos.id,
          nombre: item.grupos.nombre,
          materia: {
            nombre: item.grupos.materias.nombre
          }
        }))
      });
      
      setShowDetails(true);
    } catch (error) {
      console.error('Error al cargar detalles del estudiante:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del estudiante",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  const renderStudentsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!hasGroups) {
      return (
        <div className="py-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Necesitas crear grupos primero</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Para gestionar estudiantes, primero debes crear al menos un grupo asociado a una de tus materias.
            Los estudiantes en ProfeVision están siempre asociados a grupos específicos.
          </p>
          <Button 
            onClick={() => router.push("/dashboard/grupos")}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" /> Crear Grupo
          </Button>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="py-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aún no tienes estudiantes</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            No hay estudiantes asignados a tus grupos. Puedes crear estudiantes y luego asignarlos a grupos,
            o ir directamente a un grupo específico para añadir estudiantes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <Button 
              onClick={() => {
                setActiveTab("manual");
                setIsOpen(true);
              }} 
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Crear Estudiante
            </Button>
            <Button 
              onClick={() => router.push("/dashboard/grupos")}
            >
              <Users className="mr-2 h-4 w-4" /> Gestionar Grupos
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <Users className="inline-block mr-1 h-4 w-4" />
            {filteredStudents.length} estudiantes encontrados
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.nombre_completo}</TableCell>
                <TableCell>{student.identificacion}</TableCell>
                <TableCell>{student.email || "-"}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => fetchStudentDetails(student.id)}
                    disabled={loadingDetails}
                  >
                    {loadingDetails && selectedStudent?.id === student.id ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
              <DialogDescription>
                Grupos y materias a los que está asignado el estudiante
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedStudent?.grupos.map((grupo) => (
                <div key={grupo.id} className="flex items-start space-x-2 p-4 rounded-lg border">
                  <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">{grupo.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      Materia: {grupo.materia.nombre}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estudiantes</h2>
          <p className="text-muted-foreground">
            Administra estudiantes asignados a tus grupos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/grupos")}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" /> Gestionar Grupos
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Crear Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Agregar Estudiante</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del estudiante y selecciona el grupo al que será asignado.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre completo*</Label>
                  <Input
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    placeholder="Nombre completo del estudiante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificacion">Identificación*</Label>
                  <Input
                    id="identificacion"
                    name="identificacion"
                    value={formData.identificacion}
                    onChange={handleChange}
                    placeholder="Número de identificación"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Correo electrónico del estudiante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo*</Label>
                  <Select
                    value={formData.grupo_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, grupo_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nombre} - {grupo.materias?.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear Estudiante
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estudiantes en mis Grupos</CardTitle>
          <CardDescription>
            Estudiantes asignados a grupos que administras
          </CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <Input
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStudents()}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderStudentsList()}
        </CardContent>
      </Card>
    </div>
  );
} 