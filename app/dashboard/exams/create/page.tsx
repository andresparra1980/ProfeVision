"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Building2 } from "lucide-react";
import { Plus } from "lucide-react";
import { BookOpen } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfesor } from "@/lib/hooks/useProfesor";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Grip, Trash2, Copy, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos
type Materia = {
  id: string;
  nombre: string;
  entidad_id: string;
  entidades_educativas: {
    id: string;
    nombre: string;
  } | null;
};

type TipoPregunta = 'opcion_multiple' | 'seleccion_multiple' | 'verdadero_falso';

type Pregunta = {
  id: string;
  texto: string;
  opciones: Opcion[];
  tipo: TipoPregunta;
  puntaje: number;
  retroalimentacion?: string;
};

type Opcion = {
  id: string;
  texto: string;
  esCorrecta: boolean;
};

type Grupo = {
  id: string;
  nombre: string;
  materia_id: string;
  estado: 'activo' | 'archivado';
};

// Schema de validación
const examSchema = z.object({
  titulo: z.string().min(3, { message: "El título debe tener al menos 3 caracteres" }),
  descripcion: z.string().optional(),
  instrucciones: z.string().optional(),
  materia_id: z.string({ required_error: "Selecciona una materia" }),
  grupo_id: z.string({ required_error: "Selecciona un grupo" }),
  duracion: z.number().min(1).max(240),
  puntaje_total: z.number().min(1).max(100).default(5),
  numero_preguntas: z.number().min(1).max(40),
});

type ExamFormValues = z.infer<typeof examSchema>;

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [hasEntities, setHasEntities] = useState(false);
  const [isCheckingEntities, setIsCheckingEntities] = useState(true);
  const { profesor } = useProfesor();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposFiltrados, setGruposFiltrados] = useState<Grupo[]>([]);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
    titulo: "",
    descripcion: "",
    instrucciones: "",
    materia_id: "",
      grupo_id: "",
    duracion: 60,
      puntaje_total: 5,
      numero_preguntas: 10,
    },
  });

  useEffect(() => {
    checkEntities();
  }, []);

  useEffect(() => {
    if (profesor) {
      loadMaterias();
      loadGrupos();
    }
  }, [profesor]);

  useEffect(() => {
    const materiaId = form.watch("materia_id");
    if (materiaId) {
      const gruposDeMateria = grupos.filter(g => g.materia_id === materiaId && g.estado === 'activo');
      setGruposFiltrados(gruposDeMateria);
      // Resetear el grupo seleccionado si no pertenece a la materia
      const grupoActual = form.watch("grupo_id");
      if (grupoActual && !gruposDeMateria.find(g => g.id === grupoActual)) {
        form.setValue("grupo_id", "");
      }
    } else {
      setGruposFiltrados([]);
      form.setValue("grupo_id", "");
    }
  }, [form.watch("materia_id"), grupos]);

  async function checkEntities() {
    try {
      setIsCheckingEntities(true);
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
        setHasEntities(false);
        return;
      }

      // Si no tiene entidades, setHasEntities será false
      setHasEntities(data && data.length > 0);
    } catch (error) {
      console.error("Error inesperado al verificar entidades:", error);
      setHasEntities(false);
    } finally {
      setIsCheckingEntities(false);
    }
  }

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.";
      toast({
        variant: "destructive",
        title: "Error al cargar materias",
        description: errorMessage,
      });
    }
  };

  const loadGrupos = async () => {
    if (!profesor) return;
    
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("profesor_id", profesor.id)
        .eq("estado", 'activo')
        .order("nombre");

      if (error) throw error;
      setGrupos(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.";
      toast({
        variant: "destructive",
        title: "Error al cargar grupos",
        description: errorMessage,
      });
    }
  };

  const onSubmit = async (data: ExamFormValues) => {
    try {
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autorizado');
      }

      // Crear el examen
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          titulo: data.titulo,
          descripcion: data.descripcion,
          duracion_minutos: data.duracion,
          puntaje_total: data.puntaje_total,
          materia_id: data.materia_id,
          grupo_id: data.grupo_id,
          preguntas: preguntas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el examen');
      }

      const examData = await response.json();
      toast({
        title: "Éxito",
        description: "Examen creado correctamente",
      });
      router.push('/dashboard/exams');
    } catch (error) {
      console.error('Error al crear el examen:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al crear el examen',
      });
    }
  };

  const crearPreguntasIniciales = (cantidad: number) => {
    const puntajeTotal = form.getValues("puntaje_total");
    const puntajePorPregunta = parseFloat((puntajeTotal / cantidad).toFixed(4));
    
    const nuevasPreguntas: Pregunta[] = Array.from({ length: cantidad }, (_, index) => ({
      id: `pregunta-${index + 1}`,
      texto: "",
      tipo: "opcion_multiple",
      puntaje: puntajePorPregunta,
      opciones: [
        { id: `opcion-${index}-1`, texto: "", esCorrecta: false },
        { id: `opcion-${index}-2`, texto: "", esCorrecta: false },
        { id: `opcion-${index}-3`, texto: "", esCorrecta: false },
        { id: `opcion-${index}-4`, texto: "", esCorrecta: false },
      ],
    }));
    setPreguntas(nuevasPreguntas);
  };

  useEffect(() => {
    const numeroPreguntas = form.watch("numero_preguntas");
    if (numeroPreguntas > 0) {
      crearPreguntasIniciales(numeroPreguntas);
    }
  }, [form.watch("numero_preguntas")]);

  // The 'result' param uses DropResult type from @hello-pangea/dnd
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(preguntas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPreguntas(items);
  };

  const agregarPregunta = (index?: number) => {
    const puntajeTotal = form.getValues("puntaje_total");
    const puntajePorPregunta = parseFloat((puntajeTotal / (preguntas.length + 1)).toFixed(4));
    
    const nuevaPregunta: Pregunta = {
      id: `pregunta-${preguntas.length + 1}`,
      texto: "",
      tipo: "opcion_multiple",
      puntaje: puntajePorPregunta,
      opciones: [
        { id: `opcion-nueva-1`, texto: "", esCorrecta: false },
        { id: `opcion-nueva-2`, texto: "", esCorrecta: false },
        { id: `opcion-nueva-3`, texto: "", esCorrecta: false },
        { id: `opcion-nueva-4`, texto: "", esCorrecta: false },
      ],
    };

    if (typeof index === "number") {
      const nuevasPreguntas = [...preguntas];
      nuevasPreguntas.splice(index + 1, 0, nuevaPregunta);
      setPreguntas(nuevasPreguntas);
    } else {
      setPreguntas([...preguntas, nuevaPregunta]);
    }
  };

  const recalcularPuntajes = () => {
    if (preguntas.length === 0) return;
    
    const puntajeTotal = form.getValues("puntaje_total");
    const puntajePorPregunta = parseFloat((puntajeTotal / preguntas.length).toFixed(4));
    
    const preguntasActualizadas = preguntas.map(pregunta => ({
      ...pregunta,
      puntaje: puntajePorPregunta
    }));
    
    setPreguntas(preguntasActualizadas);
  };

  const duplicarPregunta = (index: number) => {
    const preguntaOriginal = preguntas[index];
    const preguntaDuplicada = {
      ...preguntaOriginal,
      id: `pregunta-${preguntas.length + 1}`,
      opciones: preguntaOriginal.opciones.map((opcion) => ({
        ...opcion,
        id: `opcion-${preguntas.length + 1}-${Math.random()}`,
      })),
    };

    const nuevasPreguntas = [...preguntas];
    nuevasPreguntas.splice(index + 1, 0, preguntaDuplicada);
    setPreguntas(nuevasPreguntas);
    
    // Recalcular puntajes después de agregar una pregunta
    setTimeout(recalcularPuntajes, 0);
  };

  const eliminarPregunta = (index: number) => {
    const nuevasPreguntas = preguntas.filter((_, i) => i !== index);
    setPreguntas(nuevasPreguntas);
    
    // Recalcular puntajes después de eliminar una pregunta
    if (nuevasPreguntas.length > 0) {
      setTimeout(recalcularPuntajes, 0);
    }
  };

  // Si está cargando la verificación de entidades, mostrar spinner
  if (isCheckingEntities) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay entidades educativas, mostrar un mensaje y redirigir
  if (!hasEntities) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/exams')} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Exámenes
        </Button>

        <div>
          <h2 className="text-3xl font-bold tracking-tight">Crear Examen</h2>
          <p className="text-muted-foreground">
            Define la información básica del examen
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Entidad Educativa Requerida</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Debes crear o unirte a al menos una entidad educativa antes de poder crear exámenes.
              Los exámenes deben estar asociados a una materia, y las materias a una entidad educativa.
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

  // Si no hay materias, mostrar un mensaje
  if (materias.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/exams')} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Exámenes
        </Button>

        <div>
          <h2 className="text-3xl font-bold tracking-tight">Crear Examen</h2>
          <p className="text-muted-foreground">
            Define la información básica del examen
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Materia Requerida</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Debes crear al menos una materia antes de poder crear exámenes.
              Los exámenes deben estar asociados a una materia.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/subjects/create")}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Materia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Button variant="ghost" onClick={() => router.push('/dashboard/exams')} className="mb-0">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver a Exámenes
      </Button>

      <div className="flex justify-between items-center mt-2">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Examen</h1>
          <p className="text-sm text-muted-foreground">
            Diseña un nuevo examen para tus estudiantes
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="titulo">Título del Examen*</Label>
              <Input
                id="titulo"
                  placeholder="Ej: Examen Final de Matemáticas"
                  {...form.register("titulo")}
                />
                {form.formState.errors.titulo && (
                  <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="materia">Materia*</Label>
                <Select
                  onValueChange={(value) => form.setValue("materia_id", value)}
                  value={form.watch("materia_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((materia) => (
                      <SelectItem key={materia.id} value={materia.id}>
                        {materia.nombre} - {materia.entidades_educativas?.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materia_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.materia_id.message}</p>
                )}
            </div>

              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo*</Label>
                <Select
                  onValueChange={(value) => form.setValue("grupo_id", value)}
                  value={form.watch("grupo_id")}
                  disabled={!form.watch("materia_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      form.watch("materia_id")
                        ? gruposFiltrados.length > 0
                          ? "Selecciona un grupo"
                          : "No hay grupos disponibles para esta materia"
                        : "Primero selecciona una materia"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposFiltrados.length > 0 ? (
                      gruposFiltrados.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-grupos" disabled>
                        {form.watch("materia_id")
                          ? "No hay grupos disponibles para esta materia"
                          : "Selecciona primero una materia"
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.grupo_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.grupo_id.message}</p>
                )}
                {form.watch("materia_id") && gruposFiltrados.length === 0 && (
                  <div className="text-xs text-destructive">
                    No hay grupos disponibles para esta materia.
                    <Link href="/dashboard/groups" className="ml-1 text-primary hover:underline">
                      Crear grupo
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (minutos)*</Label>
                <Input
                  id="duracion"
                  type="number"
                  min={1}
                  max={240}
                  {...form.register("duracion", { valueAsNumber: true })}
                />
                {form.formState.errors.duracion && (
                  <p className="text-sm text-destructive">{form.formState.errors.duracion.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="puntaje_total">Puntaje Total*</Label>
                <Input
                  id="puntaje_total"
                  type="number"
                  min={1}
                  max={100}
                  {...form.register("puntaje_total", { valueAsNumber: true })}
                />
                {form.formState.errors.puntaje_total && (
                  <p className="text-sm text-destructive">{form.formState.errors.puntaje_total.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_preguntas">Número de Preguntas*</Label>
                <Input
                  id="numero_preguntas"
                  type="number"
                  min={1}
                  max={40}
                  {...form.register("numero_preguntas", { valueAsNumber: true })}
                />
                {form.formState.errors.numero_preguntas && (
                  <p className="text-sm text-destructive">{form.formState.errors.numero_preguntas.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe el propósito o contenido general del examen"
                {...form.register("descripcion")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrucciones">Instrucciones (opcional)</Label>
              <Textarea
                id="instrucciones"
                placeholder="Instrucciones específicas para los estudiantes"
                {...form.register("instrucciones")}
              />
            </div>
          </CardContent>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="preguntas">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {preguntas.map((pregunta, index) => (
                  <Draggable
                    key={pregunta.id}
                    draggableId={pregunta.id}
                    index={index}
                  >
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move"
                        >
                          <Grip className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-medium">
                            Pregunta {index + 1}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => duplicarPregunta(index)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => eliminarPregunta(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Texto de la pregunta</Label>
                            <Textarea
                              value={pregunta.texto}
                              onChange={(e) => {
                                const nuevasPreguntas = [...preguntas];
                                nuevasPreguntas[index].texto = e.target.value;
                                setPreguntas(nuevasPreguntas);
                              }}
                              placeholder="Escribe aquí tu pregunta"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Tipo de Pregunta</Label>
                            <Select
                              value={pregunta.tipo}
                              onValueChange={(value: TipoPregunta) => {
                                const nuevasPreguntas = [...preguntas];
                                nuevasPreguntas[index].tipo = value;
                                // Si cambia a verdadero/falso, ajustar las opciones
                                if (value === 'verdadero_falso') {
                                  nuevasPreguntas[index].opciones = [
                                    { id: `opcion-${pregunta.id}-1`, texto: "Verdadero", esCorrecta: false },
                                    { id: `opcion-${pregunta.id}-2`, texto: "Falso", esCorrecta: false },
                                  ];
                                }
                                // Si cambia a opción múltiple y no tiene opciones, crear las básicas
                                else if (value === 'opcion_multiple' && nuevasPreguntas[index].opciones.length < 2) {
                                  nuevasPreguntas[index].opciones = [
                                    { id: `opcion-${pregunta.id}-1`, texto: "", esCorrecta: false },
                                    { id: `opcion-${pregunta.id}-2`, texto: "", esCorrecta: false },
                                    { id: `opcion-${pregunta.id}-3`, texto: "", esCorrecta: false },
                                    { id: `opcion-${pregunta.id}-4`, texto: "", esCorrecta: false },
                                  ];
                                }
                                setPreguntas(nuevasPreguntas);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de pregunta" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="opcion_multiple">Opción múltiple</SelectItem>
                                <SelectItem value="seleccion_multiple">Selección múltiple</SelectItem>
                                <SelectItem value="verdadero_falso">Verdadero/Falso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Opciones</Label>
                            {pregunta.opciones.map((opcion, opcionIndex) => (
                              <div key={opcion.id} className="flex items-center gap-2">
                                <input
                                  type={pregunta.tipo === 'seleccion_multiple' ? "checkbox" : "radio"}
                                  checked={opcion.esCorrecta}
                                  onChange={() => {
                                    const nuevasPreguntas = [...preguntas];
                                    if (pregunta.tipo === 'seleccion_multiple') {
                                      // Para selección múltiple, toggle la opción
                                      nuevasPreguntas[index].opciones[opcionIndex].esCorrecta = 
                                        !nuevasPreguntas[index].opciones[opcionIndex].esCorrecta;
                                    } else {
                                      // Para opción múltiple y verdadero/falso, solo una correcta
                                      nuevasPreguntas[index].opciones = nuevasPreguntas[index].opciones.map((op, i) => ({
                                        ...op,
                                        esCorrecta: i === opcionIndex,
                                      }));
                                    }
                                    setPreguntas(nuevasPreguntas);
                                  }}
                                  className="h-4 w-4"
                                  disabled={pregunta.tipo === 'verdadero_falso' && opcion.texto !== ""}
                                />
                                <Input
                                  value={opcion.texto}
                                  onChange={(e) => {
                                    const nuevasPreguntas = [...preguntas];
                                    nuevasPreguntas[index].opciones[opcionIndex].texto = e.target.value;
                                    setPreguntas(nuevasPreguntas);
                                  }}
                                  placeholder={`Opción ${opcionIndex + 1}`}
                                  disabled={pregunta.tipo === 'verdadero_falso'}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const nuevasPreguntas = [...preguntas];
                                    nuevasPreguntas[index].opciones = nuevasPreguntas[index].opciones
                                      .filter((_, i) => i !== opcionIndex);
                                    setPreguntas(nuevasPreguntas);
                                  }}
                                  disabled={pregunta.opciones.length <= 2 || pregunta.tipo === 'verdadero_falso'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {pregunta.tipo !== 'verdadero_falso' && pregunta.opciones.length < 4 && (
            <Button 
                                type="button"
              variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const nuevasPreguntas = [...preguntas];
                                  nuevasPreguntas[index].opciones.push({
                                    id: `opcion-${pregunta.id}-${nuevasPreguntas[index].opciones.length + 1}`,
                                    texto: "",
                                    esCorrecta: false,
                                  });
                                  setPreguntas(nuevasPreguntas);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Añadir opción
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Retroalimentación (opcional)</Label>
                            <Textarea
                              value={pregunta.retroalimentacion || ""}
                              onChange={(e) => {
                                const nuevasPreguntas = [...preguntas];
                                nuevasPreguntas[index].retroalimentacion = e.target.value;
                                setPreguntas(nuevasPreguntas);
                              }}
                              placeholder="Retroalimentación para esta pregunta"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="flex justify-center">
          <Button
              type="button"
            variant="outline"
            onClick={() => agregarPregunta()}
            disabled={preguntas.length >= 40}
            >
            <Plus className="h-4 w-4 mr-2" />
            Añadir pregunta
            </Button>
        </div>

        <div className="flex justify-end gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Examen"}
            </Button>
        </div>
      </form>
    </div>
  );
} 