"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Save, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [questionToToggle, setQuestionToToggle] = useState<{id: string, habilitada: boolean} | null>(null);
  const [tiposPregunta, setTiposPregunta] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    texto: "",
    tipo_id: "",
    puntaje: 10,
    dificultad: "media",
    retroalimentacion: "",
    opciones: [
      { texto: "", es_correcta: true },
      { texto: "", es_correcta: false },
      { texto: "", es_correcta: false },
      { texto: "", es_correcta: false },
    ],
  });

  useEffect(() => {
    fetchExamDetails();
    fetchQuestions();
    fetchQuestionTypes();
  }, [examId]);

  async function fetchExamDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select("*, materias(nombre)")
        .eq("id", examId)
        .single();

      if (error) throw error;
      setExam(data);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del examen",
        variant: "destructive",
      });
      router.push("/dashboard/exams");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions() {
    try {
      const { data, error } = await supabase
        .from("preguntas")
        .select(`*, opciones_respuesta(*)`)
        .eq("examen_id", examId)
        .order("orden", { ascending: true });

      if (error) throw error;
      
      // Organizar las opciones_respuesta dentro de cada pregunta
      const formattedQuestions = data.map(q => ({
        ...q,
        opciones: q.opciones_respuesta || []
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas del examen",
        variant: "destructive",
      });
    }
  }

  async function fetchQuestionTypes() {
    try {
      const { data, error } = await supabase
        .from("tipos_pregunta")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setTiposPregunta(data);
      
      // Establecer el primer tipo como predeterminado si está disponible
      if (data.length > 0) {
        setCurrentQuestion(prev => ({
          ...prev,
          tipo_id: data[0].id
        }));
      }
    } catch (error) {
      console.error("Error fetching question types:", error);
    }
  }

  // Función para manejar el cambio en los campos de la pregunta actual
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar cambios en opciones de respuesta
  const handleOptionChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const newOptions = [...currentQuestion.opciones];
    newOptions[index] = { ...newOptions[index], texto: value };
    setCurrentQuestion(prev => ({
      ...prev,
      opciones: newOptions
    }));
  };

  // Función para marcar una opción como correcta
  const handleCorrectOption = (index: number) => {
    const newOptions = currentQuestion.opciones.map((option, i) => ({
      ...option,
      es_correcta: i === index // Solo la opción seleccionada será correcta
    }));
    setCurrentQuestion(prev => ({
      ...prev,
      opciones: newOptions
    }));
  };

  // Función para agregar la pregunta al examen
  const addQuestion = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!currentQuestion.texto.trim()) {
        toast({
          title: "Error",
          description: "El texto de la pregunta es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!currentQuestion.tipo_id) {
        toast({
          title: "Error",
          description: "Debes seleccionar un tipo de pregunta",
          variant: "destructive",
        });
        return;
      }

      // Validar que al menos una opción tenga texto
      const hasValidOptions = currentQuestion.opciones.some(opt => opt.texto.trim() !== "");
      if (!hasValidOptions) {
        toast({
          title: "Error",
          description: "Debes agregar al menos una opción con texto",
          variant: "destructive",
        });
        return;
      }

      // Calcular el orden de la nueva pregunta
      const orden = questions.length > 0 
        ? Math.max(...questions.map(q => q.orden || 0)) + 1 
        : 1;

      // Insertar pregunta
      const { data: questionData, error: questionError } = await supabase
        .from("preguntas")
        .insert({
          examen_id: examId,
          texto: currentQuestion.texto,
          tipo_id: currentQuestion.tipo_id,
          puntaje: currentQuestion.puntaje,
          dificultad: currentQuestion.dificultad,
          retroalimentacion: currentQuestion.retroalimentacion,
          orden: orden
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Filtrar solo las opciones que tengan texto
      const validOptions = currentQuestion.opciones
        .filter(opt => opt.texto.trim() !== "")
        .map((opt, index) => ({
          pregunta_id: questionData.id,
          texto: opt.texto,
          es_correcta: opt.es_correcta,
          orden: index + 1
        }));

      // Insertar opciones de respuesta
      if (validOptions.length > 0) {
        const { error: optionsError } = await supabase
          .from("opciones_respuesta")
          .insert(validOptions);

        if (optionsError) throw optionsError;
      }

      // Actualizar el estado
      toast({
        title: "Éxito",
        description: "Pregunta agregada correctamente",
      });

      // Recargar preguntas
      fetchQuestions();

      // Reiniciar el formulario
      setCurrentQuestion({
        texto: "",
        tipo_id: tiposPregunta.length > 0 ? tiposPregunta[0].id : "",
        puntaje: 10,
        dificultad: "media",
        retroalimentacion: "",
        opciones: [
          { texto: "", es_correcta: true },
          { texto: "", es_correcta: false },
          { texto: "", es_correcta: false },
          { texto: "", es_correcta: false },
        ],
      });
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la pregunta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para eliminar una pregunta
  const deleteQuestion = async (questionId: string) => {
    try {
      setSaving(true);
      
      // Eliminar primero las opciones de respuesta (por restricción de llaves foráneas)
      const { error: optionsError } = await supabase
        .from("opciones_respuesta")
        .delete()
        .eq("pregunta_id", questionId);

      if (optionsError) throw optionsError;

      // Luego eliminar la pregunta
      const { error: questionError } = await supabase
        .from("preguntas")
        .delete()
        .eq("id", questionId);

      if (questionError) throw questionError;

      toast({
        title: "Éxito",
        description: "Pregunta eliminada correctamente",
      });

      // Recargar preguntas
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la pregunta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para publicar el examen
  const publishExam = async () => {
    try {
      setSaving(true);
      
      // Verificar que tenga al menos una pregunta
      if (questions.length === 0) {
        toast({
          title: "Error",
          description: "No puedes publicar un examen sin preguntas",
          variant: "destructive",
        });
        return;
      }

      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autorizado');
      }

      // Usar el endpoint PATCH para actualizar el estado del examen
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          estado: "publicado"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al publicar el examen');
      }

      toast({
        title: "Éxito",
        description: "Examen publicado correctamente",
      });

      // Recargar datos del examen
      fetchExamDetails();
    } catch (error) {
      console.error("Error publishing exam:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el examen",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para manejar el toggle de habilitación/deshabilitación de pregunta
  const handleQuestionToggle = async (questionId: string, currentValue: boolean) => {
    if (exam.estado === "publicado") {
      setQuestionToToggle({ id: questionId, habilitada: !currentValue });
      setShowDisableDialog(true);
    } else {
      await toggleQuestionStatus(questionId, !currentValue);
    }
  };

  // Función para confirmar el toggle de una pregunta
  const confirmQuestionToggle = async () => {
    if (!questionToToggle) return;
    
    await toggleQuestionStatus(questionToToggle.id, questionToToggle.habilitada);
    setShowDisableDialog(false);
    setQuestionToToggle(null);
  };

  // Función para actualizar el estado de habilitación de una pregunta
  const toggleQuestionStatus = async (questionId: string, newStatus: boolean) => {
    try {
      setSaving(true);
      
      // Actualizar el estado de la pregunta
      const { error: updateError } = await supabase
        .from("preguntas")
        .update({ habilitada: newStatus })
        .eq("id", questionId);

      if (updateError) throw updateError;

      // Si el examen está publicado, recalcular las calificaciones de todos los estudiantes
      // sin importar si estamos habilitando o deshabilitando
      if (exam.estado === "publicado") {
        // Obtener todos los resultados del examen
        const { data: resultados, error: resultadosError } = await supabase
          .from("resultados_examen")
          .select("id, puntaje_obtenido, porcentaje")
          .eq("examen_id", examId);

        if (resultadosError) throw resultadosError;

        // Para cada resultado, recalcular el puntaje considerando solo preguntas habilitadas
        for (const resultado of resultados) {
          // Obtener todas las respuestas del estudiante
          const { data: respuestas, error: respuestasError } = await supabase
            .from("respuestas_estudiante")
            .select(`
              pregunta_id,
              es_correcta,
              pregunta:preguntas!inner(
                habilitada
              )
            `)
            .eq("resultado_id", resultado.id);

          if (respuestasError) throw respuestasError;

          // Definir el tipo de respuesta como lo retorna Supabase
          interface RespuestaEstudiante {
            pregunta_id: string;
            es_correcta: boolean;
            pregunta: {
              habilitada: boolean;
            };
          }

          // Hacer un cast seguro de los datos
          const respuestasTyped = (respuestas as unknown) as RespuestaEstudiante[];

          // Filtrar solo las respuestas de preguntas habilitadas
          const respuestasHabilitadas = respuestasTyped.filter(r => r.pregunta.habilitada);
          const respuestasCorrectas = respuestasHabilitadas.filter(r => r.es_correcta).length;
          
          // Calcular nuevo porcentaje y nota usando la misma fórmula que en save-results
          const nuevoPorcentaje = (respuestasCorrectas / respuestasHabilitadas.length) * 100;
          const nuevaNota = (respuestasCorrectas / respuestasHabilitadas.length) * 5;

          // Actualizar el resultado
          const { error: updateResultadoError } = await supabase
            .from("resultados_examen")
            .update({
              puntaje_obtenido: nuevaNota,
              porcentaje: nuevoPorcentaje,
              updated_at: new Date().toISOString()
            })
            .eq("id", resultado.id);

          if (updateResultadoError) throw updateResultadoError;
        }
      }

      // Recargar preguntas para actualizar la UI
      fetchQuestions();

      toast({
        title: "Éxito",
        description: `Pregunta ${newStatus ? "habilitada" : "deshabilitada"} correctamente`,
      });
    } catch (error) {
      console.error("Error toggling question status:", error);
      toast({
        title: "Error",
        description: `No se pudo ${newStatus ? "habilitar" : "deshabilitar"} la pregunta`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p>No se encontró el examen solicitado.</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/exams")}
        >
          Volver a Exámenes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard/exams")}
            className="mb-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Exámenes
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{exam.titulo}</h2>
          <p className="text-muted-foreground">
            {exam.materias?.nombre} | {exam.estado === "borrador" ? "Borrador" : "Publicado"}
          </p>
        </div>
        {exam.estado === "borrador" && (
          <Button onClick={publishExam} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Publicar Examen
          </Button>
        )}
      </div>

      {/* Preguntas existentes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Preguntas ({questions.length})</h3>
        
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Este examen aún no tiene preguntas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className={`relative ${!question.habilitada ? 'opacity-75' : ''}`}>
                <div className="absolute left-4 top-4 p-2 text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <CardHeader className="pl-14">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">Pregunta {index + 1}</CardTitle>
                      <CardDescription>
                        {tiposPregunta.find(t => t.id === question.tipo_id)?.nombre || "Tipo desconocido"} | 
                        {question.puntaje} puntos
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {exam.estado === "publicado" && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`question-${question.id}-enabled`} className="text-sm">
                            {question.habilitada ? "Habilitada" : "Deshabilitada"}
                          </Label>
                          <Switch
                            id={`question-${question.id}-enabled`}
                            checked={question.habilitada}
                            onCheckedChange={() => handleQuestionToggle(question.id, question.habilitada)}
                          />
                        </div>
                      )}
                      {exam.estado === "borrador" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">{question.texto}</p>
                      {question.retroalimentacion && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">Retroalimentación:</span> {question.retroalimentacion}
                        </p>
                      )}
                    </div>
                    
                    {question.opciones && question.opciones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Opciones:</p>
                        <div className="space-y-2">
                          {question.opciones.map((option: any, optIndex: number) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${option.es_correcta ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {optIndex + 1}
                              </div>
                              <p className={option.es_correcta ? 'font-medium' : ''}>{option.texto}</p>
                              {option.es_correcta && (
                                <span className="text-xs text-green-600">(Correcta)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para agregar nueva pregunta */}
      {exam.estado === "borrador" && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar Nueva Pregunta</CardTitle>
            <CardDescription>
              Define el contenido y opciones de respuesta para la pregunta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="texto">Texto de la Pregunta*</Label>
              <Textarea
                id="texto"
                name="texto"
                value={currentQuestion.texto}
                onChange={handleQuestionChange}
                placeholder="Ej. ¿Cuál es la capital de Francia?"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipo_id">Tipo de Pregunta*</Label>
                <Select
                  value={currentQuestion.tipo_id}
                  onValueChange={(value) => handleSelectChange("tipo_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPregunta.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="puntaje">Puntaje</Label>
                <Input
                  id="puntaje"
                  name="puntaje"
                  type="number"
                  min={1}
                  value={currentQuestion.puntaje}
                  onChange={handleQuestionChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dificultad">Dificultad</Label>
                <Select
                  value={currentQuestion.dificultad}
                  onValueChange={(value) => handleSelectChange("dificultad", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retroalimentacion">Retroalimentación (opcional)</Label>
              <Textarea
                id="retroalimentacion"
                name="retroalimentacion"
                value={currentQuestion.retroalimentacion}
                onChange={handleQuestionChange}
                placeholder="Explicación o retroalimentación para mostrar después de contestar"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Opciones de Respuesta</Label>
              <div className="space-y-3">
                {currentQuestion.opciones.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                        value={option.texto}
                        onChange={(e) => handleOptionChange(index, e)}
                        placeholder={`Opción ${index + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant={option.es_correcta ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCorrectOption(index)}
                    >
                      {option.es_correcta ? "Correcta" : "Marcar como correcta"}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                *Solo se guardarán las opciones que tengan texto
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={addQuestion} disabled={saving} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" /> Agregar Pregunta
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Modal de confirmación para deshabilitar pregunta */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿{questionToToggle?.habilitada ? 'Habilitar' : 'Deshabilitar'} pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              {questionToToggle?.habilitada ? (
                'Al habilitar esta pregunta, se volverá a considerar en la calificación de los estudiantes.'
              ) : (
                'Al deshabilitar esta pregunta, se recalcularán las calificaciones de todos los estudiantes que ya tomaron este examen, excluyendo esta pregunta del cálculo.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuestionToggle}>
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 