"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, Users, BookOpen, Calendar, Archive, ArchiveRestore, Calculator, MoreVertical, ChevronLeft, TriangleAlert } from "lucide-react";
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
import { format, isWithinInterval, startOfYear, endOfYear, addYears, startOfMonth, endOfMonth, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import logger from "@/lib/utils/logger";
import { AuthError } from "@supabase/supabase-js";

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

type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas: EntidadEducativa | null;
};

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
  const [groupNameToConfirmDelete, setGroupNameToConfirmDelete] = useState<string | null>(null);
  const [typedGroupName, setTypedGroupName] = useState("");
  const { profesor, loading: profesorLoading, error: profesorError } = useProfesor();
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

  // Helper function for consistent error logging
  const handleSupabaseError = useCallback((context: string, error: unknown) => {
    const errorObj = error as Error;
    const isSupabaseError = errorObj instanceof AuthError;
    const status = isSupabaseError ? (errorObj as AuthError).status : undefined;

    // Safely access code and details
    let code: string | undefined = undefined;
    let details: string | undefined = undefined;

    if (typeof errorObj === 'object' && errorObj !== null) {
      if ('code' in errorObj) {
        code = String((errorObj as { code?: unknown }).code);
      }
      if ('details' in errorObj) {
        details = String((errorObj as { details?: unknown }).details);
      }
    }

    logger.error(`[GroupsPage] ${context}:`, {
      message: errorObj.message,
      status: status,
      code: code,
      details: details,
      errorObject: errorObj
    });

    toast({
      variant: "destructive",
      title: `Error en ${context}`,
      description: `Error: ${errorObj?.message || 'Desconocido'}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`
    });
  }, []);

  const loadGrupos = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadGrupos: professor not ready.', { hasProfesor: !!profesor, profesorLoading, profesorError });
      setLoading(false);
      return;
    }
    
    logger.log('[GroupsPage] Loading grupos for professor:', profesor.id);
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
            logger.error(`Error al obtener conteo para grupo ${grupo.id}:`, countError);
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
    } catch (error: unknown) {
      handleSupabaseError('Error al cargar grupos', error);
    } finally {
      setLoading(false);
    }
  }, [profesor, profesorLoading, profesorError, mostrarArchivados, handleSupabaseError]);

  const loadMaterias = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadMaterias: professor not ready.');
      return;
    }

    logger.log('[GroupsPage] Loading materias for profesor:', profesor.id);
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
      
      // Ensure all materias have consistent data structure with explicit entidad_id
      const processedData = data?.map((materia: Materia) => {
        // Si el objeto ya tiene entidad_id directo, lo usamos
        // Si no, intentamos obtenerlo de la relación entidades_educativas
        const entidad_id = materia.entidad_id || 
                          (materia.entidades_educativas?.id || null);
        
        return {
          ...materia,
          entidad_id: entidad_id
        };
      }) || [];
      
      setMaterias(processedData);
    } catch (error: unknown) {
      handleSupabaseError('Error al cargar materias', error);
    }
  }, [profesor, profesorLoading, profesorError, handleSupabaseError]);

  const loadEntidades = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadEntidades: professor not ready.');
      return;
    }

    logger.log('[GroupsPage] Loading entidades for profesor:', profesor.id);
    try {
      // Cargamos todas las entidades disponibles para el profesor
      const { data: entidadesData, error: entidadesError } = await supabase
        .from("entidades_educativas")
        .select("*")
        .eq("profesor_id", profesor.id)
        .order("nombre");
        
      if (entidadesError) throw entidadesError;
      
      logger.log("Entidades totales disponibles:", entidadesData?.length || 0);
      setEntidades(entidadesData || []);
    } catch (error: unknown) {
      handleSupabaseError('Error al cargar entidades educativas', error);
    }
  }, [profesor, profesorLoading, profesorError, handleSupabaseError]);

  useEffect(() => {
    if (!profesorLoading && profesor && !profesorError) {
      logger.log('[GroupsPage] Professor ready, triggering data load.');
      loadGrupos();
      loadMaterias();
      loadEntidades();
    } else if (profesorLoading) {
      logger.log('[GroupsPage] Waiting for professor data...');
      // setLoading(true);
    } else if (profesorError) {
      logger.error('[GroupsPage] Professor hook reported an error, not loading page data.', profesorError);
      setLoading(false);
    } else if (!profesor && !profesorLoading) {
       logger.log('[GroupsPage] No professor data and not loading, possibly logged out or initial state.');
       setLoading(false);
    }
  }, [profesor, profesorLoading, profesorError, loadGrupos, loadMaterias, loadEntidades]);

  useEffect(() => {
    if (editingGrupo) {
      // Primero cargar la entidad y luego la materia para mantener la consistencia
      const entidadId = editingGrupo.materias?.entidades_educativas?.id || "";
      form.setValue("entidad_id", entidadId);
      
      if (entidadId) {
        // Filtrar materias por la entidad seleccionada usando la lógica mejorada
        const materiasDeEntidad = materias.filter(m => {
          // Verificamos si la materia tiene entidad_id directamente
          if (m.entidad_id === entidadId) {
            return true;
          }
          
          // Verificamos la relación anidada en entidades_educativas
          if (m.entidades_educativas && m.entidades_educativas.id === entidadId) {
            return true;
          }
          
          return false;
        });
        
        setMateriasFiltradas(materiasDeEntidad);
        
        // Esperar al siguiente ciclo para que las materias se filtren
        setTimeout(() => {
          form.setValue("materia_id", editingGrupo.materia_id);
        }, 50);
      }

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
  }, [editingGrupo, form, materias]);

  // Watch entidad_id for changes
  const selectedEntidadId = form.watch("entidad_id");
  
  useEffect(() => {
    if (selectedEntidadId) {
      const materiasDeEntidad = materias.filter(m => {
        // Verificamos si la materia tiene entidad_id directamente
        if (m.entidad_id === selectedEntidadId) {
          return true;
        }
        
        // Verificamos la relación anidada en entidades_educativas
        if (m.entidades_educativas && m.entidades_educativas.id === selectedEntidadId) {
          return true;
        }
        
        return false;
      });
      
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
  }, [selectedEntidadId, materias, form]);

  useEffect(() => {
    loadGrupos();
  }, [mostrarArchivados, loadGrupos]);

  useEffect(() => {
    if (startDate && endDate) {
      const periodoInterpretado = interpretarPeriodoEscolar(startDate, endDate);
      form.setValue("periodo_escolar", periodoInterpretado);
    }
  }, [startDate, endDate, form]);

  const onSubmit = async (data: GrupoFormValues) => {
    if (!profesor) return;
    logger.log('[GroupsPage] Submitting group form...');
    try {
      if (editingGrupo) {
        // Actualizar
        const { error } = await supabase
          .from("grupos")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
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
          materia_id: data.materia_id,
          profesor_id: profesor.id,
          año_escolar: data.periodo_escolar || null,
          periodo_escolar: data.periodo_escolar || null,
        };
        
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
    } catch (error: unknown) {
      handleSupabaseError('Error al guardar grupo', error);
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setOpenDialog(true);
  };

  const confirmDeleteGrupo = async () => {
    if (!deletingId) return;
    logger.log(`[GroupsPage] Attempting to delete group ID: ${deletingId}`);
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
    } catch (error: unknown) {
      handleSupabaseError('al eliminar grupo', error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
      setGroupNameToConfirmDelete(null);
      setTypedGroupName("");
    }
  };

  const toggleArchivarGrupo = async (grupo: Grupo) => {
    logger.log(`[GroupsPage] Toggling archive state for group ID: ${grupo.id} to ${grupo.estado === 'activo' ? 'archivado' : 'activo'}`);
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
    } catch (error: unknown) {
      handleSupabaseError('Error al cambiar estado del grupo', error);
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

  // 1. Handle Initial Professor Load (only if professor isn't loaded yet)
  if (profesorLoading && !profesor) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. Handle Professor Load Error
  if (profesorError) {
     return (
      <div className="flex h-screen items-center justify-center text-center text-destructive">
        Error al cargar los datos del profesor: {profesorError.message}
      </div>
     );
  }

  // 3. Handle Logged Out / No Professor State
  if (!profesor) {
     // This should be hit after SIGNED_OUT and failed refresh
     return (
       <div className="flex h-screen items-center justify-center text-center text-muted-foreground">
         No se pudieron cargar los datos. Por favor, intenta iniciar sesión de nuevo.
       </div>
     );
  }

  // 4. Professor is loaded, render the main content
  //    Now, loading only refers to the local loading for groups/materias/etc.
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
            <Dialog open={openDialog} onOpenChange={setOpenDialog} modal={true}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGrupo(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-[#FAFAF4] dark:bg-[#171717]">
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
                    <Label htmlFor="nombre">Nombre del grupo (Ej: 10-A, Grupo Mañana, etc.)*</Label>
                    <Input
                      id="nombre"
                      placeholder=""
                      className="bg-white dark:bg-[#1E1E1F]"
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
                      <SelectTrigger id="entidad" className="bg-white dark:bg-[#1E1E1F]">
                        <SelectValue placeholder="Selecciona una entidad educativa" />
                      </SelectTrigger>
                      <SelectContent>
                        {entidades.length > 0 ? (
                          <>

                            {entidades.map((entidad) => (
                              <SelectItem key={entidad.id} value={entidad.id}>
                                {entidad.nombre}
                              </SelectItem>
                            ))}
                          </>
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
                      <SelectTrigger id="materia" className="bg-white dark:bg-[#1E1E1F]">
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
                        <Link href="/dashboard/subjects" className="ml-1 text-primary hover:underline">
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
                            <SelectTrigger className="w-[140px] bg-white dark:bg-[#1E1E1F]">
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
                            <SelectTrigger className="w-[100px] bg-white dark:bg-[#1E1E1F]">
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
                            <SelectTrigger className="w-[140px] bg-white dark:bg-[#1E1E1F]">
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
                            <SelectTrigger className="w-[100px] bg-white dark:bg-[#1E1E1F]">
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
                      className="bg-white dark:bg-[#1E1E1F]"
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

      {/* Content Section - Spinner only depends on local 'loading' now */}
      {loading ? ( // Use the local loading state for the content spinner
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
                          setGroupNameToConfirmDelete(grupo.nombre);
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

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog 
        open={confirmDelete} 
        onOpenChange={(isOpen) => {
          setConfirmDelete(isOpen);
          if (!isOpen) {
            setGroupNameToConfirmDelete(null);
            setTypedGroupName("");
          }
        }} 
        modal={true}
      >
        <DialogContent className="sm:max-w-md border-red-500 dark:border-red-700 shadow-xl rounded-lg bg-card dark:bg-background">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-2xl font-bold">
              <TriangleAlert className="h-7 w-7 mr-2 text-red-600 dark:text-red-400" />
              ¡ADVERTENCIA! Eliminación Permanente
            </DialogTitle>
            <DialogDescription className="mt-2 space-y-2">
              <p>
                Está a punto de eliminar el grupo{" "}
                <span className="font-semibold">{groupNameToConfirmDelete || "seleccionado"}</span>.
              </p>
              <p>
                Esta acción es <span className="font-semibold uppercase">IRREVERSIBLE</span> y resultará en:
              </p>
              <ul className="list-disc list-inside ml-4 text-sm">
                <li>Eliminación de todas las <span className="font-semibold">inscripciones de estudiantes</span> a este grupo.</li>
                <li>Eliminación de todos los <span className="font-semibold">esquemas de calificación</span> asociados.</li>
                <li>Eliminación de todas las <span className="font-semibold">asignaciones de exámenes</span> a este grupo.</li>
                <li>Las referencias a este grupo en los <span className="font-semibold">escaneos de exámenes</span> existentes se perderán (se marcarán como NULAS).</li>
              </ul>
              <p className="mt-3">
                Para confirmar esta acción y proceder con la eliminación, por favor escriba el nombre exacto del grupo en el campo de abajo.
              </p>
              <p className="mt-3">
                Recuerde que puede <span className="font-semibold">Archivar</span> el grupo para evitar la eliminación permanente.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Label htmlFor="group-confirm-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Escriba &quot;<span className="font-semibold text-red-600 dark:text-red-400">{groupNameToConfirmDelete}</span>&quot; para confirmar:
            </Label>
            <Input
              id="group-confirm-name"
              value={typedGroupName}
              onChange={(e) => setTypedGroupName(e.target.value)}
              placeholder="Nombre exacto del grupo"
              className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDelete(false);
                setGroupNameToConfirmDelete(null);
                setTypedGroupName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteGrupo}
              disabled={typedGroupName !== groupNameToConfirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar este grupo y sus datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 