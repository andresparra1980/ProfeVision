"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";

// Configurar flag de debug para mensajes de consola
const DEBUG = process.env.NODE_ENV === 'development';

// Define el esquema de validación para el formulario
const formSchema = z.object({
  componentesSeleccionados: z.array(z.string()).min(1, {
    message: "Debes seleccionar al menos un componente de calificación",
  }),
});

type Componente = {
  id: string;
  nombre: string;
  porcentaje: number;
  periodo: {
    id: string;
    nombre: string;
    esquema: {
      id: string;
      nombre: string;
      grupo: {
        id: string;
        nombre: string;
      };
    };
  };
};

type ComponentePorGrupo = {
  grupoId: string;
  grupoNombre: string;
  esquemaId: string;
  esquemaNombre: string;
  periodos: {
    periodoId: string;
    periodoNombre: string;
    componentes: Componente[];
  }[];
};

type Grupo = {
  id: string;
  nombre: string;
};

type PeriodoCalificacion = {
  id: string;
  nombre: string;
};

type ComponenteCalificacion = {
  id: string;
  nombre: string;
  porcentaje: number;
};

type Vinculacion = {
  id: string;
  componente_id: string;
};

export default function LinkGradeComponentPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use para "unwrap" los parámetros de ruta
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gruposDelExamen, setGruposDelExamen] = useState<Grupo[]>([]);
  const [componentes, setComponentes] = useState<ComponentePorGrupo[]>([]);
  const [examen, setExamen] = useState<{ titulo: string; estado: string } | null>(null);

  // Configurar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      componentesSeleccionados: [],
    },
  });

  // Cargar datos del examen y grupos asignados
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Obtener información del examen
        const { data: examenData, error: examenError } = await supabase
          .from("examenes")
          .select("titulo, estado")
          .eq("id", examId)
          .single();
        
        if (examenError) throw examenError;
        setExamen(examenData);
        
        // Obtener grupos asignados al examen
        const { data: gruposData, error: gruposError } = await supabase
          .from("examen_grupo")
          .select("grupo:grupo_id(id, nombre)")
          .eq("examen_id", examId);
        
        if (gruposError) throw gruposError;
        
        const grupos = gruposData.map((g: { grupo: Grupo }) => g.grupo);
        setGruposDelExamen(grupos);
        
        if (grupos.length === 0) {
          setLoading(false);
          return;
        }
        
        // Obtener componentes de calificación de los grupos
        const promesasComponentes = grupos.map(async (grupo: Grupo) => {
          const { data: esquemasData, error: esquemasError } = await supabase
            .from("esquemas_calificacion")
            .select(`
              id, 
              nombre, 
              grupo_id
            `)
            .eq("grupo_id", grupo.id)
            .eq("es_activo", true);
          
          if (esquemasError) throw esquemasError;
          
          if (!esquemasData || esquemasData.length === 0) {
            return null;
          }
          
          const promesasPeriodos = esquemasData.map(async (esquema: { id: string; nombre: string; grupo_id: string }) => {
            const { data: periodosData, error: periodosError } = await supabase
              .from("periodos_calificacion")
              .select(`
                id, 
                nombre
              `)
              .eq("esquema_id", esquema.id);
            
            if (periodosError) throw periodosError;
            
            if (!periodosData || periodosData.length === 0) {
              return {
                grupoId: grupo.id,
                grupoNombre: grupo.nombre,
                esquemaId: esquema.id,
                esquemaNombre: esquema.nombre,
                periodos: []
              };
            }
            
            const promesasComponentesPorPeriodo = periodosData.map(async (periodo: PeriodoCalificacion) => {
              const { data: componentesData, error: componentesError } = await supabase
                .from("componentes_calificacion")
                .select(`
                  id, 
                  nombre, 
                  porcentaje
                `)
                .eq("periodo_id", periodo.id);
              
              if (componentesError) throw componentesError;
              
              return {
                periodoId: periodo.id,
                periodoNombre: periodo.nombre,
                componentes: (componentesData || []).map((c: ComponenteCalificacion) => ({
                  ...c,
                  periodo: {
                    id: periodo.id,
                    nombre: periodo.nombre,
                    esquema: {
                      id: esquema.id,
                      nombre: esquema.nombre,
                      grupo: {
                        id: grupo.id,
                        nombre: grupo.nombre
                      }
                    }
                  }
                }))
              };
            });
            
            const periodos = await Promise.all(promesasComponentesPorPeriodo);
            
            return {
              grupoId: grupo.id,
              grupoNombre: grupo.nombre,
              esquemaId: esquema.id,
              esquemaNombre: esquema.nombre,
              periodos
            };
          });
          
          const resultados = await Promise.all(promesasPeriodos);
          return resultados.filter(Boolean);
        });
        
        const resultadosComponentes = await Promise.all(promesasComponentes);
        const componentesPorGrupo: ComponentePorGrupo[] = resultadosComponentes
          .flat()
          .filter(Boolean) as ComponentePorGrupo[];
        
        setComponentes(componentesPorGrupo);
        
        // Verificar si el examen ya está vinculado a algún componente
        const { data: vinculacionesData, error: vinculacionesError } = await supabase
          .from("examenes_a_componentes_calificacion")
          .select("componente_id")
          .eq("examen_id", examId);
        
        if (vinculacionesError) throw vinculacionesError;
        
        const idsComponentesVinculados = vinculacionesData.map((v: { componente_id: string }) => v.componente_id);
        
        // Establecer los valores iniciales del formulario
        form.setValue("componentesSeleccionados", idsComponentesVinculados);
        
        setLoading(false);
      } catch (error) {
        if (DEBUG) {
          console.error("Error al cargar datos:", error);
        }
        toast.error("Error al cargar componentes de calificación");
        setLoading(false);
      }
    }
    
    fetchData();
  }, [examId, form]);
  
  // Manejar la envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);
      
      // Obtener componentes actualmente vinculados
      const { data: vinculacionesActuales, error: vinculacionesError } = await supabase
        .from("examenes_a_componentes_calificacion")
        .select("id, componente_id")
        .eq("examen_id", examId);
      
      if (vinculacionesError) throw vinculacionesError;
      
      const idsActuales = vinculacionesActuales.map((v: Vinculacion) => v.componente_id);
      
      // Determinar componentes a eliminar y a agregar
      const componentesAEliminar = idsActuales.filter((id: string) => !values.componentesSeleccionados.includes(id));
      const componentesAAgregar = values.componentesSeleccionados.filter(id => !idsActuales.includes(id));
      
      // Eliminar vinculaciones que ya no se desean
      if (componentesAEliminar.length > 0) {
        const { error: errorEliminar } = await supabase
          .from("examenes_a_componentes_calificacion")
          .delete()
          .eq("examen_id", examId)
          .in("componente_id", componentesAEliminar);
        
        if (errorEliminar) throw errorEliminar;
      }
      
      // Agregar nuevas vinculaciones
      if (componentesAAgregar.length > 0) {
        const nuevasVinculaciones = componentesAAgregar.map(componenteId => ({
          examen_id: examId,
          componente_id: componenteId
        }));
        
        const { error: errorAgregar } = await supabase
          .from("examenes_a_componentes_calificacion")
          .insert(nuevasVinculaciones);
        
        if (errorAgregar) throw errorAgregar;
      }
      
      toast.success("Vinculaciones actualizadas correctamente");
      router.push("/dashboard/exams");
    } catch (error: unknown) {
      if (DEBUG) {
        console.error("Error al guardar vinculaciones:", error);
      }
      toast.error("Error al guardar las vinculaciones");
    } finally {
      setSaving(false);
    }
  };
  
  // Renderizar un mensaje de carga
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando componentes de calificación...</p>
      </div>
    );
  }
  
  // Renderizar mensaje si no hay grupos asignados
  if (gruposDelExamen.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Vincular Examen a Componentes de Calificación</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No hay grupos asignados</CardTitle>
            <CardDescription>
              Este examen no tiene grupos asignados. Primero debes asignar el examen a uno o más grupos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/exams/${examId}/assign`)}>
              Asignar Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Renderizar mensaje si no hay componentes de calificación disponibles
  if (componentes.length === 0 || componentes.every(g => g.periodos.length === 0 || g.periodos.every(p => p.componentes.length === 0))) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Vincular Examen a Componentes de Calificación</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No hay componentes de calificación</CardTitle>
            <CardDescription>
              No se encontraron componentes de calificación para los grupos asignados a este examen.
              Primero debes crear un esquema de calificación con periodos y componentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/grades/schemes")}>
              Ir a Esquemas de Calificación
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Vincular Examen a Componentes de Calificación</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{examen?.titulo || "Examen"}</CardTitle>
          <CardDescription>
            Selecciona los componentes de calificación a los que quieres vincular este examen.
            Las calificaciones de los estudiantes se trasladarán automáticamente a estos componentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="componentesSeleccionados"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Componentes de Calificación Disponibles</FormLabel>
                      <FormDescription>
                        Selecciona los componentes a los que deseas vincular este examen
                      </FormDescription>
                    </div>
                    
                    {componentes.map((grupo) => (
                      <div key={grupo.grupoId} className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Grupo: {grupo.grupoNombre}</h3>
                        <div className="ml-4">
                          <h4 className="text-md font-medium text-muted-foreground mb-2">Esquema: {grupo.esquemaNombre}</h4>
                          
                          {grupo.periodos.map((periodo) => (
                            <div key={periodo.periodoId} className="ml-4 mb-4">
                              <h5 className="text-sm font-medium mb-2">Periodo: {periodo.periodoNombre}</h5>
                              
                              <div className="space-y-2 ml-4">
                                {periodo.componentes.map((componente) => (
                                  <FormField
                                    key={componente.id}
                                    control={form.control}
                                    name="componentesSeleccionados"
                                    render={({ field }: { field: { value: string[], onChange: (value: string[]) => void } }) => {
                                      return (
                                        <FormItem key={componente.id} className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(componente.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, componente.id])
                                                  : field.onChange(field.value?.filter((value) => value !== componente.id));
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {componente.nombre} ({componente.porcentaje}%)
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/exams")}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Guardando..." : "Guardar Vinculaciones"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 