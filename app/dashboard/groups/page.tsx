"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, Users, BookOpen, Calendar, Archive, ArchiveRestore, Calculator, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfesor } from "@/lib/hooks/useProfesor";
import Link from "next/link";
import type { Database } from "@/lib/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isWithinInterval, startOfYear, endOfYear, addYears, startOfMonth, endOfMonth, addMonths, setMonth, setYear, parse } from "date-fns";
import { es } from "date-fns/locale";


type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & {
  materias: {
    id: string;
    nombre: string;
    entidades_educativas: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  estudiantes_count: { count: number } | number;
  entidad_id?: string;
  estado: 'activo' | 'archivado';
};

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas: {
    id: string;
    nombre: string;
  } | null;
};

type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

const grupoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  entidad_id: z.string({ required_error: "Selecciona una entidad educativa" }),
  materia_id: z.string({ required_error: "Selecciona una materia" }),
  periodo_escolar: z.string().optional(),
});

type GrupoFormValues = z.infer<typeof grupoSchema>;

export default function GroupsPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { profesor } = useProfesor();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const form = useForm<GrupoFormValues>({
    resolver: zodResolver(grupoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      entidad_id: "",
      materia_id: "",
      periodo_escolar: "",
    },
  });

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(setMonth(new Date(), i), 'MMMM', { locale: es })
  }));

  useEffect(() => {
    if (profesor) {
      loadGrupos();
      loadMaterias();
      loadEntidades();
    }
  }, [profesor]);

  useEffect(() => {
    if (editingGrupo) {
      // Primero cargar la entidad y luego la materia para mantener la consistencia
      form.setValue("entidad_id", editingGrupo.materias?.entidades_educativas?.id || "");
      
      // Esperar al siguiente ciclo para que las materias se filtren
      setTimeout(() => {
        form.setValue("materia_id", editingGrupo.materia_id);
      }, 0);

      form.setValue("nombre", editingGrupo.nombre);
      form.setValue("descripcion", editingGrupo.descripcion || "");
      form.setValue("periodo_escolar", editingGrupo.periodo_escolar || "");

      // Si hay un período escolar, intentar interpretarlo para mostrar las fechas
      if (editingGrupo.periodo_escolar) {
        // Aquí podrías intentar interpretar el período escolar inverso para setear las fechas
        // Por ahora dejamos las fechas vacías
        setStartDate(null);
        setEndDate(null);
      }
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        entidad_id: "",
        materia_id: "",
        periodo_escolar: "",
      });
      setStartDate(null);
      setEndDate(null);
    }
  }, [editingGrupo, form]);

  useEffect(() => {
    const entidadId = form.watch("entidad_id");
    if (entidadId) {
      const materiasDeEntidad = materias.filter(m => m.entidad_id === entidadId);
      setMateriasFiltradas(materiasDeEntidad);
      // Resetear la materia seleccionada si no pertenece a la entidad
      const materiaActual = form.watch("materia_id");
      if (materiaActual && !materiasDeEntidad.find(m => m.id === materiaActual)) {
        form.setValue("materia_id", "");
      }
    } else {
      setMateriasFiltradas([]);
      form.setValue("materia_id", "");
    }
  }, [form.watch("entidad_id"), materias]);

  useEffect(() => {
    loadGrupos();
  }, [mostrarArchivados]);

  useEffect(() => {
    if (startDate && endDate) {
      const periodoInterpretado = interpretarPeriodoEscolar(startDate, endDate);
      form.setValue("periodo_escolar", periodoInterpretado);
    }
  }, [startDate, endDate]);

  const loadGrupos = async () => {
    if (!profesor) return;
    
    try {
      setLoading(true);
      
      const { data: gruposData, error: gruposError } = await supabase
        .from("grupos")
        .select(`
          *,
          materias!inner (
            id,
            nombre,
            entidades_educativas (
              id,
              nombre
            )
          )
        `)
        .eq("profesor_id", profesor.id)
        .eq("estado", mostrarArchivados ? 'archivado' : 'activo')
        .order("nombre");

      if (gruposError) throw gruposError;
      
      if (!gruposData || gruposData.length === 0) {
        setGrupos([]);
        return;
      }
      
      // Para cada grupo, obtener el conteo de estudiantes
      const gruposConConteo = await Promise.all(
        gruposData.map(async (grupo: Grupo) => {
          const { count, error: countError } = await supabase
            .from('estudiante_grupo')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_id', grupo.id);
          
          if (countError) {
            console.error(`Error al obtener conteo para grupo ${grupo.id}:`, countError);
            return {
              ...grupo,
              estudiantes_count: 0
            };
          }
          
          return {
            ...grupo,
            estudiantes_count: count || 0
          };
        })
      );
      
      setGrupos(gruposConConteo);
    } catch (error: any) {
      console.error('Error al cargar grupos:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar grupos",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMaterias = async () => {
    if (!profesor) return;
    
    try {
      const { data, error } = await supabase
        .from("materias")
        .select(`
          *,
          entidades_educativas (
            id,
            nombre
          )
        `)
        .eq("profesor_id", profesor.id)
        .order("nombre");

      if (error) throw error;
      setMaterias(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar materias",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const loadEntidades = async () => {
    if (!profesor) return;
    
    try {
      const { data: materias, error: materiasError } = await supabase
        .from("materias")
        .select("*, entidades_educativas!inner(*)")
        .eq("profesor_id", profesor.id);

      if (materiasError) throw materiasError;

      // Extraer entidades únicas de las materias
      const entidadesMap = new Map<string, EntidadEducativa>();
      materias?.forEach((materia: any) => {
        const entidad = materia.entidades_educativas;
        if (entidad && entidad.id) {
          entidadesMap.set(entidad.id, {
            id: entidad.id,
            nombre: entidad.nombre,
            tipo: entidad.tipo,
            ciudad: entidad.ciudad || null,
            direccion: entidad.direccion || null,
            email: entidad.email || null,
            logo_url: entidad.logo_url || null,
            pais: entidad.pais || null,
            telefono: entidad.telefono || null,
            website: entidad.website || null,
            created_at: entidad.created_at,
            updated_at: entidad.updated_at
          });
        }
      });
      
      setEntidades(Array.from(entidadesMap.values()));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar entidades educativas",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const onSubmit = async (data: GrupoFormValues) => {
    if (!profesor) return;
    
    try {
      if (editingGrupo) {
        // Actualizar
        const { error } = await supabase
          .from("grupos")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            entidad_id: data.entidad_id,
            materia_id: data.materia_id,
            año_escolar: data.periodo_escolar || null,
            periodo_escolar: data.periodo_escolar || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGrupo.id);

        if (error) throw error;
        toast({
          title: "Grupo actualizado",
          description: "El grupo ha sido actualizado correctamente.",
        });
      } else {
        // Crear nuevo
        const dataToInsert = {
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          entidad_id: data.entidad_id,
          materia_id: data.materia_id,
          profesor_id: profesor.id,
          año_escolar: data.periodo_escolar || null,
          periodo_escolar: data.periodo_escolar || null,
        };
        
        console.log('Datos a insertar:', dataToInsert);
        
        const { error } = await supabase
          .from("grupos")
          .insert(dataToInsert);

        if (error) throw error;
        toast({
          title: "Grupo creado",
          description: "El grupo ha sido creado correctamente.",
        });
      }
      
      setOpenDialog(false);
      setEditingGrupo(null);
      form.reset();
      loadGrupos();
    } catch (error: any) {
      console.error('Error al guardar grupo:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar grupo",
        description: error.message 
          ? `${error.message} ${error.code ? `(Código: ${error.code})` : ''} ${error.details ? `- ${error.details}` : ''}`
          : "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setOpenDialog(true);
  };

  const confirmDeleteGrupo = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      
      toast({
        title: "Grupo eliminado",
        description: "El grupo ha sido eliminado correctamente.",
      });
      
      loadGrupos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar grupo",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
    }
  };

  const toggleArchivarGrupo = async (grupo: Grupo) => {
    try {
      const nuevoEstado = grupo.estado === 'activo' ? 'archivado' : 'activo';
      const { error } = await supabase
        .from("grupos")
        .update({ 
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq("id", grupo.id);

      if (error) throw error;
      
      toast({
        title: grupo.estado === 'activo' ? "Grupo archivado" : "Grupo activado",
        description: grupo.estado === 'activo' 
          ? "El grupo ha sido archivado correctamente." 
          : "El grupo ha sido activado correctamente.",
      });
      
      loadGrupos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cambiar estado del grupo",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  // Función para interpretar el período escolar
  const interpretarPeriodoEscolar = (desde?: Date, hasta?: Date): string => {
    if (!desde || !hasta) return "";

    // Formatear fechas para comparación
    const inicioAno = startOfYear(desde);
    const finAno = endOfYear(desde);
    const inicioSiguienteAno = startOfYear(addYears(desde, 1));
    const finSiguienteAno = endOfYear(addYears(desde, 1));

    // Verificar si es un año lectivo (cruza dos años)
    if (
      isWithinInterval(desde, { start: startOfMonth(inicioAno), end: endOfMonth(finAno) }) &&
      isWithinInterval(hasta, { start: startOfMonth(inicioSiguienteAno), end: endOfMonth(finSiguienteAno) })
    ) {
      return `Año lectivo ${format(desde, 'yyyy')}-${format(hasta, 'yyyy')}`;
    }

    // Verificar si es un semestre
    const mesInicio = desde.getMonth();
    const mesFin = hasta.getMonth();
    
    // Primer semestre: Enero/Febrero a Mayo/Junio
    if ((mesInicio === 0 || mesInicio === 1) && (mesFin === 4 || mesFin === 5)) {
      return `${format(desde, 'yyyy')} Primer semestre`;
    }
    
    // Segundo semestre: Julio/Agosto a Noviembre/Diciembre
    if ((mesInicio === 6 || mesInicio === 7) && (mesFin === 10 || mesFin === 11)) {
      return `${format(desde, 'yyyy')} Segundo semestre`;
    }

    // Si no coincide con ningún patrón, devolver solo mes y año
    return `${format(desde, 'MMMM yyyy', { locale: es })} - ${format(hasta, 'MMMM yyyy', { locale: es })}`;
  };

  const handleStartDateChange = (month: number, year: number) => {
    const newDate = setYear(setMonth(new Date(), month), year);
    setStartDate(startOfMonth(newDate));
    if (endDate) {
      // Si la nueva fecha de inicio es posterior a la fecha de fin
      if (newDate > endDate) {
        // Si están en el mismo año y el mes de inicio es mayor, ajustamos el año de fin
        if (year === endDate.getFullYear() && month > endDate.getMonth()) {
          const newEndDate = setYear(endDate, year + 1);
          setEndDate(endOfMonth(newEndDate));
          updatePeriodoEscolar(startOfMonth(newDate), endOfMonth(newEndDate));
          return;
        }
        setEndDate(null);
      }
    }
    updatePeriodoEscolar(startOfMonth(newDate), endDate);
  };

  const handleEndDateChange = (month: number, year: number) => {
    const newDate = setYear(setMonth(new Date(), month), year);
    setEndDate(endOfMonth(newDate));
    if (startDate) {
      // Si la nueva fecha de fin es anterior a la fecha de inicio
      if (newDate < startDate) {
        // Si están en el mismo año y el mes de fin es menor, ajustamos el año de fin
        if (year === startDate.getFullYear() && month < startDate.getMonth()) {
          const adjustedDate = setYear(newDate, year + 1);
          setEndDate(endOfMonth(adjustedDate));
          updatePeriodoEscolar(startDate, endOfMonth(adjustedDate));
          return;
        }
      }
    }
    updatePeriodoEscolar(startDate, endOfMonth(newDate));
  };

  const updatePeriodoEscolar = (desde: Date | null, hasta: Date | null) => {
    if (!desde || !hasta) return;
    const periodoInterpretado = interpretarPeriodoEscolar(desde, hasta);
    form.setValue("periodo_escolar", periodoInterpretado);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos</h1>
          <div className="text-sm text-muted-foreground">
            Administra tus grupos de estudiantes
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setMostrarArchivados(!mostrarArchivados)}
            className="bg-rose-500 text-primary-foreground hover:bg-rose-600 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90 transition-colors"
          >
            {mostrarArchivados ? (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" /> Ver Grupos Activos
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" /> Ver Grupos Archivados
              </>
            )}
          </Button>
          {!mostrarArchivados && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGrupo(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>{editingGrupo ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
                  <DialogDescription>
                    {editingGrupo 
                      ? "Actualiza la información del grupo." 
                      : "Ingresa los datos del nuevo grupo."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre*</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej: 10-A, Grupo Mañana, etc."
                      {...form.register("nombre")}
                    />
                    {form.formState.errors.nombre && (
                      <div className="text-sm text-destructive">{form.formState.errors.nombre.message}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="entidad">Entidad Educativa*</Label>
                    <Select
                      onValueChange={(value: string) => form.setValue("entidad_id", value)}
                      value={form.watch("entidad_id")}
                    >
                      <SelectTrigger id="entidad">
                        <SelectValue placeholder="Selecciona una entidad educativa" />
                      </SelectTrigger>
                      <SelectContent>
                        {entidades.length > 0 ? (
                          entidades.map((entidad) => (
                            <SelectItem key={entidad.id} value={entidad.id}>
                              {entidad.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-entidades" disabled>
                            No hay entidades educativas registradas
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.entidad_id && (
                      <div className="text-sm text-destructive">{form.formState.errors.entidad_id.message}</div>
                    )}
                    {entidades.length === 0 && (
                      <div className="text-xs text-destructive">
                        Debes crear al menos una entidad educativa antes de crear un grupo.
                        <Link href="/dashboard/entidades-educativas" className="ml-1 text-primary hover:underline">
                          Crear entidad educativa
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materia">Materia*</Label>
                    <Select
                      onValueChange={(value: string) => form.setValue("materia_id", value)}
                      value={form.watch("materia_id")}
                      disabled={!form.watch("entidad_id")}
                    >
                      <SelectTrigger id="materia">
                        <SelectValue placeholder={
                          form.watch("entidad_id") 
                            ? "Selecciona una materia" 
                            : "Primero selecciona una entidad educativa"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {materiasFiltradas.length > 0 ? (
                          materiasFiltradas.map((materia) => (
                            <SelectItem key={materia.id} value={materia.id}>
                              {materia.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-materias" disabled>
                            {form.watch("entidad_id") 
                              ? "No hay materias para esta entidad educativa" 
                              : "Selecciona primero una entidad educativa"
                            }
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.materia_id && (
                      <div className="text-sm text-destructive">{form.formState.errors.materia_id.message}</div>
                    )}
                    {form.watch("entidad_id") && materiasFiltradas.length === 0 && (
                      <div className="text-xs text-destructive">
                        No hay materias registradas para esta entidad educativa.
                        <Link href="/dashboard/materias" className="ml-1 text-primary hover:underline">
                          Crear materia
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Periodo Escolar</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Fecha Inicio</Label>
                        <div className="flex gap-2">
                          <Select
                            value={startDate ? startDate.getMonth().toString() : ""}
                            onValueChange={(value) => {
                              if (startDate) {
                                handleStartDateChange(parseInt(value), startDate.getFullYear());
                              } else {
                                handleStartDateChange(parseInt(value), new Date().getFullYear());
                              }
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={startDate ? startDate.getFullYear().toString() : ""}
                            onValueChange={(value) => {
                              handleStartDateChange(
                                startDate ? startDate.getMonth() : 0,
                                parseInt(value)
                              );
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Fecha Fin</Label>
                        <div className="flex gap-2">
                          <Select
                            value={endDate ? endDate.getMonth().toString() : ""}
                            onValueChange={(value) => {
                              if (endDate) {
                                handleEndDateChange(parseInt(value), endDate.getFullYear());
                              } else {
                                handleEndDateChange(parseInt(value), new Date().getFullYear());
                              }
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={endDate ? endDate.getFullYear().toString() : ""}
                            onValueChange={(value) => {
                              handleEndDateChange(
                                endDate ? endDate.getMonth() : 0,
                                parseInt(value)
                              );
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {form.watch("periodo_escolar") && (
                      <div className="text-sm text-muted-foreground">
                        Periodo interpretado: {form.watch("periodo_escolar")}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Información adicional sobre el grupo"
                      {...form.register("descripcion")}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOpenDialog(false);
                        setEditingGrupo(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={materias.length === 0}>
                      {editingGrupo ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <div className="mb-4 text-center text-muted-foreground">
              No hay grupos registrados.
            </div>
            {materias.length === 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Debes crear al menos una materia antes de crear un grupo.
                <Link href="/dashboard/subjects" className="ml-1 font-medium text-primary hover:underline">
                  Ir a crear materia
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Card key={grupo.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      <span className="truncate block">{grupo.nombre}</span>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="text-sm">
                        Materia: {grupo.materias?.nombre || "No asignada"}
                      </div>
                      <div className="text-sm">
                        Entidad: {grupo.materias?.entidades_educativas?.nombre || "No asignada"}
                      </div>
                      {grupo.periodo_escolar && (
                        <div className="text-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Periodo: {grupo.periodo_escolar}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(grupo)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar grupo
                      </DropdownMenuItem>
                      <Link href={`/dashboard/groups/${grupo.id}/students`} className="w-full">
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Gestion de Estudiantes
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/dashboard/groups/${grupo.id}/grades`} className="w-full">
                        <DropdownMenuItem>
                          <Calculator className="h-4 w-4 mr-2" />
                          Tabulado de Notas
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/dashboard/groups/${grupo.id}/grading-scheme`} className="w-full">
                        <DropdownMenuItem>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Esquema de Calificaciones
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleArchivarGrupo(grupo)}>
                        {grupo.estado === 'activo' ? (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Archivar
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeletingId(grupo.id);
                          setConfirmDelete(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    <span>
                      {typeof grupo.estudiantes_count === 'number' 
                        ? grupo.estudiantes_count 
                        : grupo.estudiantes_count?.count || 0} estudiantes
                    </span>
                  </div>
                  {grupo.descripcion && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {grupo.descripcion}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer y eliminará la relación con todos los estudiantes asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGrupo}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 