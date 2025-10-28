"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, RefreshCw, UserPlus, BookOpen, School, Folders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TitleCardWithDepth } from "@/components/shared/title-card-with-depth";

interface FormData {
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  grupo_id: string;
}

interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  created_at: string;
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

interface Grupo {
  id: string;
  nombre: string;
  materias: {
    nombre: string;
  };
}

const initialFormData: FormData = {
  nombres: "",
  apellidos: "",
  identificacion: "",
  email: "",
  grupo_id: "",
};

export default function StudentsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.students');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGroups, setHasGroups] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const checkForGroups = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { error: groupError, count } = await supabase
        .from("grupos")
        .select("*", { count: 'exact' })
        .eq("profesor_id", session.user.id)
        .limit(1);

      if (groupError) {
        toast.error(t('error.title'), {
          description: t('error.verifyGroups'),
        });
        return;
      }

      setHasGroups(count !== null && count > 0);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.verifyGroups'),
      });
    }
  }, [router, t]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Obtener estudiantes que pertenecen a los grupos del profesor
      const { data: estudiantes, error: estudiantesError } = await supabase
        .from('estudiantes')
        .select(`
          id,
          nombres,
          apellidos,
          identificacion,
          email,
          created_at,
          estudiante_grupo!inner(
            grupos!inner(
              profesor_id
            )
          )
        `)
        .eq('estudiante_grupo.grupos.profesor_id', session.user.id)
        .order('apellidos')
        .order('nombres');

      if (estudiantesError) {
        throw estudiantesError;
      }
      
      // Transformar los datos para obtener un formato más fácil de usar
      const uniqueStudents = estudiantes.map((estudiante: Student) => ({
        id: estudiante.id,
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        identificacion: estudiante.identificacion,
        email: estudiante.email,
        created_at: estudiante.created_at
      }));
      
      setStudents(uniqueStudents);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.loadingStudents'),
      });
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  const loadGrupos = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data, error: gruposError } = await supabase
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

      if (gruposError) throw gruposError;
      setGrupos(data || []);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.loadingGroups'),
      });
    }
  }, [t]);

  useEffect(() => {
    checkForGroups();
    fetchStudents();
    loadGrupos();
  }, [checkForGroups, fetchStudents, loadGrupos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.nombres || !formData.apellidos || !formData.identificacion || !formData.grupo_id) {
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
        setError('El grupo seleccionado no es válido');
        setIsSubmitting(false);
        return;
      }

      // Crear el estudiante o usar uno existente
      const { data: existingStudent, error: checkError } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('identificacion', formData.identificacion)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      let studentId;

      if (existingStudent && existingStudent.length > 0) {
        // Estudiante ya existe
        studentId = existingStudent[0].id;
      } else {
        // Crear nuevo estudiante
        const { data: newStudent, error: createError } = await supabase
          .from('estudiantes')
          .insert({
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            identificacion: formData.identificacion,
            email: formData.email || null,
          })
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        studentId = newStudent.id;
      }

      // Vincular estudiante al grupo
      const { error: linkError } = await supabase
        .from('estudiante_grupo')
        .insert({
          estudiante_id: studentId,
          grupo_id: formData.grupo_id,
        });

      if (linkError) {
        throw linkError;
      }

      // Éxito
      toast.success("Estudiante agregado", {
        description: "El estudiante ha sido agregado al grupo exitosamente",
      });

      setFormData(initialFormData);
      setIsOpen(false);
      fetchStudents();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Ha ocurrido un error al agregar el estudiante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      grupo_id: value,
    }));
  };

  const filteredStudents = students.filter((student) =>
    student.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.identificacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function fetchStudentDetails(studentId: string) {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from("estudiante_grupo")
        .select(`
          grupo_id,
          grupos (
            id,
            nombre,
            materias (
              nombre
            )
          )
        `)
        .eq("estudiante_id", studentId);

      if (error) throw error;

      if (data) {
        const grupos = data.map((item: {
          grupos: {
            id: string;
            nombre: string;
            materias: {
              nombre: string;
            }
          }
        }) => ({
          id: item.grupos.id,
          nombre: item.grupos.nombre,
          materia: {
            nombre: item.grupos.materias.nombre
          }
        }));

        setSelectedStudent({
          id: studentId,
          grupos: grupos
        });
        setShowDetails(true);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Error", {
        description: err.message || "No se pudo cargar la información del estudiante",
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
          <h3 className="text-lg font-semibold mb-2">{t('empty.noGroups.title')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {t('empty.noGroups.description')}
          </p>
          <Button 
            onClick={() => router.push("/dashboard/groups")}
            className="bg-secondary text-white hover:bg-secondary/90 dark:text-black dark:hover:bg-secondary/90"
          >
            <Folders className="mr-2 h-4 w-4" /> {t('empty.noGroups.createGroup')}
          </Button>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="py-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('empty.noStudents.title')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {t('empty.noStudents.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <Button 
              onClick={() => {
                setIsOpen(true);
              }} 
              variant="outline"
            >
              <UserPlus className="mr-2 h-4 w-4" /> {t('empty.noStudents.createStudent')}
            </Button>
            <Button 
              onClick={() => router.push("/dashboard/groups")}
              className="bg-secondary text-white hover:bg-secondary/90 dark:text-black dark:hover:bg-secondary/90"
            >
              <Folders className="mr-2 h-4 w-4" /> {t('empty.noStudents.manageGroups')}
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
            {filteredStudents.length} {t('table.studentsFound')}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.headers.surnames')}</TableHead>
              <TableHead>{t('table.headers.names')}</TableHead>
              <TableHead>{t('table.headers.identification')}</TableHead>
              <TableHead>{t('table.headers.email')}</TableHead>
              <TableHead>{t('table.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student: Student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.apellidos}</TableCell>
                <TableCell>{student.nombres}</TableCell>
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
                    {t('table.actions.viewDetails')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={showDetails} onOpenChange={setShowDetails} modal={true}>
          <DialogContent className="bg-[#FAFAF4] dark:bg-[#171717]">
            <DialogHeader>
              <DialogTitle>{t('details.title')}</DialogTitle>
              <DialogDescription>
                {t('details.description')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedStudent?.grupos.map((grupo) => (
                <div key={grupo.id} className="flex items-start space-x-2 p-4 rounded-lg border">
                  <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">{grupo.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('details.subject')}: {grupo.materia.nombre}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                {t('details.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <TitleCardWithDepth
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/groups")}
              className="bg-secondary text-white hover:bg-secondary/90 dark:text-black dark:hover:bg-secondary/90 w-full sm:w-auto"
            >
              <Folders className="mr-2 h-4 w-4" /> {t('actions.manageGroups')}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> {t('actions.createStudent')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#FAFAF4] dark:bg-[#171717]">
              <DialogHeader>
                <DialogTitle>{t('form.title')}</DialogTitle>
                <DialogDescription>
                  {t('form.description')}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">{t('form.names')}*</Label>
                  <Input
                    id="nombres"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.names')}
                    className="bg-white dark:bg-[#1E1E1F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">{t('form.surnames')}*</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.surnames')}
                    className="bg-white dark:bg-[#1E1E1F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificacion">{t('form.identification')}*</Label>
                  <Input
                    id="identificacion"
                    name="identificacion"
                    value={formData.identificacion}
                    onChange={handleChange}
                    placeholder={t('form.placeholders.identification')}
                    className="bg-white dark:bg-[#1E1E1F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('form.placeholders.email')}
                    className="bg-white dark:bg-[#1E1E1F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo">{t('form.group')}*</Label>
                  <Select
                    value={formData.grupo_id}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="bg-white dark:bg-[#1E1E1F]">
                      <SelectValue placeholder={t('form.placeholders.selectGroup')} />
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
                    {t('form.actions.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {t('form.actions.creating')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('form.actions.create')}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
          <CardDescription>
            {t('table.description')}
          </CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <Input
              placeholder={t('table.search')}
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
              <RefreshCw className="h-4 w-4 mr-2" /> {t('table.refreshList')}
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