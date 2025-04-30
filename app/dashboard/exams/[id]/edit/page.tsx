"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Save, Trash2, GripVertical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { QuestionContent } from "@/components/exam/question-content";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import logger from "@/lib/utils/logger";

interface TipoPregunta {
  id: string;
  nombre: string;
}

interface OpcionRespuesta {
  id?: string;
  texto: string;
  es_correcta: boolean;
}

interface Pregunta {
  id?: string;
  texto: string;
  tipo_id: string;
  puntaje: number;
  dificultad: string;
  retroalimentacion: string;
  habilitada?: boolean;
  orden?: number;
  opciones: OpcionRespuesta[];
  opciones_respuesta?: OpcionRespuesta[];
}

interface Examen {
  id: string;
  titulo: string;
  estado: string;
  materias?: {
    nombre: string;
  };
  puntaje_total?: number;
  [key: string]: unknown;
}

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showCorrectAnswerDialog, setShowCorrectAnswerDialog] = useState(false);
  const [pendingCorrectAnswer, setPendingCorrectAnswer] = useState<{
    questionId: string;
    optionId: string;
    optionIndex: number;
    questionIndex: number;
  } | null>(null);
  const [questionToToggle, setQuestionToToggle] = useState<{id: string, habilitada: boolean} | null>(null);
  const [tiposPregunta, setTiposPregunta] = useState<TipoPregunta[]>([]);
  const [exam, setExam] = useState<Examen | null>(null);
  const [questions, setQuestions] = useState<Pregunta[]>([]);
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
  const [editorKey, setEditorKey] = useState(0);

  const fetchExamDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select("*, materias(nombre), puntaje_total")
        .eq("id", examId)
        .single();

      if (error) throw error;
      setExam(data);
    } catch (error) {
      logger.error("Error fetching exam details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del examen",
        variant: "destructive",
      });
      router.push("/dashboard/exams");
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("preguntas")
        .select(`*, opciones_respuesta(*)`)
        .eq("examen_id", examId)
        .order("orden", { ascending: true });

      if (error) throw error;
      
      // Organizar las opciones_respuesta dentro de cada pregunta
      const formattedQuestions = data.map((q: Record<string, unknown>) => {
        // Ordenar las opciones de respuesta por el campo orden
        const opcionesOrdenadas = Array.isArray(q.opciones_respuesta) 
          ? [...q.opciones_respuesta].sort((a, b) => (a.orden || 0) - (b.orden || 0))
          : [];
          
        return {
          ...q,
          opciones: opcionesOrdenadas
        };
      });
      
      setQuestions(formattedQuestions);
    } catch (error) {
      logger.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas del examen",
        variant: "destructive",
      });
    }
  }, [examId]);

  const fetchQuestionTypes = useCallback(async () => {
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
      logger.error("Error fetching question types:", error);
    }
  }, []);

  useEffect(() => {
    fetchExamDetails();
    fetchQuestions();
    fetchQuestionTypes();
  }, [fetchExamDetails, fetchQuestions, fetchQuestionTypes]);

  // Función para manejar el cambio en los campos de la pregunta actual
  const _handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar cambios en selects
  const _handleSelectChange = (name: string, value: string) => {
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

      // Set default type if not already set
      if (!currentQuestion.tipo_id && tiposPregunta.length > 0) {
        currentQuestion.tipo_id = tiposPregunta[0].id;
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

      // Calculate the initial points for the new question
      // After adding, we'll recalculate points for all questions
      const totalExamPoints = exam?.puntaje_total || 5;
      const newQuestionCount = questions.length + 1;
      const initialPointValue = parseFloat((totalExamPoints / newQuestionCount).toFixed(4));

      // Insertar pregunta
      const { data: questionData, error: questionError } = await supabase
        .from("preguntas")
        .insert({
          examen_id: examId,
          texto: currentQuestion.texto,
          tipo_id: currentQuestion.tipo_id,
          puntaje: initialPointValue, // Use calculated initial value
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

      // Recalculate points for all questions including the new one
      await recalculatePointsPerQuestion(questions.length + 1);

      // Actualizar el estado
      toast({
        title: "Éxito",
        description: "Pregunta agregada correctamente",
      });

      // Recargar preguntas
      fetchQuestions();

      // Create a completely new question object to ensure the RichTextEditor resets
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
      
      // Force a complete remount of the rich text editor by changing its key
      setEditorKey(prevKey => prevKey + 1);
    } catch (error) {
      logger.error("Error adding question:", error);
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

      // Calculate the new question count after deletion
      const newQuestionCount = questions.length - 1;
      
      // Recalculate points if there are questions left
      if (newQuestionCount > 0) {
        // Pass the new question count to recalculate based on the updated count
        await recalculatePointsPerQuestion(newQuestionCount);
      }

      toast({
        title: "Éxito",
        description: "Pregunta eliminada correctamente",
      });

      // Recargar preguntas
      fetchQuestions();
    } catch (error) {
      logger.error("Error deleting question:", error);
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
      logger.error("Error publishing exam:", error);
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
    if (exam && exam.estado === "publicado") {
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
      if (exam && exam.estado === "publicado") {
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

          // Si no hay respuestas registradas, omitir recálculo (examen calificado manualmente)
          if (respuestasTyped.length === 0) {
            logger.log(`Omitiendo recálculo para resultado ${resultado.id}: evaluación manual`);
            continue;
          }

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
      logger.error("Error toggling question status:", error);
      toast({
        title: "Error",
        description: `No se pudo ${newStatus ? "habilitar" : "deshabilitar"} la pregunta`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // A function to recalculate the point value per question based on total score / number of questions
  const recalculatePointsPerQuestion = useCallback(async (customQuestionCount?: number) => {
    if (!exam) return;
    
    // Get total points from exam
    const totalPoints = exam.puntaje_total ? exam.puntaje_total : 5;
    
    // Use custom count if provided, otherwise use current questions length
    const questionCount = customQuestionCount || questions.length;
    if (questionCount === 0) return;
    
    // Calculate points per question (rounded to 4 decimal places)
    const pointsPerQuestion = parseFloat((totalPoints / questionCount).toFixed(4));
    
    // Update state for UI
    setQuestions(prevQuestions => 
      prevQuestions.map(q => ({
        ...q,
        puntaje: pointsPerQuestion
      }))
    );
    
    // Also update database for all questions with new point value
    try {
      setSaving(true);
      
      // Get IDs of all questions that are not new (have a valid DB ID)
      const questionIds = questions
        .filter(q => q.id && typeof q.id === 'string' && !q.id.startsWith('temp-'))
        .map(q => q.id);
      
      if (questionIds.length > 0) {
        // Batch update all questions with the new point value
        const { error } = await supabase
          .from("preguntas")
          .update({ puntaje: pointsPerQuestion })
          .in("id", questionIds as string[]);
        
        if (error) {
          logger.warn("Error updating question points:", error);
          toast({
            title: "Advertencia",
            description: "No se pudieron actualizar los puntajes de las preguntas en la base de datos",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      logger.error("Error in recalculatePointsPerQuestion:", error);
    } finally {
      setSaving(false);
    }
  }, [exam, questions, setSaving]);

  // Función para confirmar cambio de respuesta correcta
  const confirmChangeCorrectAnswer = async () => {
    if (!pendingCorrectAnswer) return;
    try {
      setSaving(true);
      
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autorizado');
      }

      // Llamar al endpoint para actualizar la respuesta correcta
      const response = await fetch(`/api/exams/${examId}/update-correct-answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          questionId: pendingCorrectAnswer.questionId,
          optionId: pendingCorrectAnswer.optionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la respuesta correcta');
      }

      // Actualizar estado local para reflejar el cambio
      const updatedQuestions = [...questions];
      const questionIndex = pendingCorrectAnswer.questionIndex;
      
      if (updatedQuestions[questionIndex] && updatedQuestions[questionIndex].opciones) {
        // Actualizar todas las opciones para esta pregunta
        updatedQuestions[questionIndex].opciones = updatedQuestions[questionIndex].opciones.map((option, idx) => ({
          ...option,
          es_correcta: idx === pendingCorrectAnswer.optionIndex
        }));
        
        setQuestions(updatedQuestions);
      }

      toast({
        title: "Éxito",
        description: "Respuesta correcta actualizada y calificaciones recalculadas",
      });
    } catch (error) {
      logger.error("Error updating correct answer:", error);
      toast({
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "No se pudo actualizar la respuesta correcta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowCorrectAnswerDialog(false);
      setPendingCorrectAnswer(null);
    }
  };
  
  // Función para manejar el clic en una opción para cambiar la respuesta correcta
  const handleCorrectAnswerChange = (questionId: string, optionId: string, optionIndex: number, questionIndex: number) => {
    setPendingCorrectAnswer({
      questionId,
      optionId,
      optionIndex,
      questionIndex
    });
    setShowCorrectAnswerDialog(true);
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
              <Card key={question.id ? question.id : index} className={`relative ${!question.habilitada ? 'opacity-75' : ''}`}>
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
                      {exam && exam.estado === "publicado" && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`question-${question.id ? question.id : index}-enabled`} className="text-sm">
                            {question.habilitada ? "Habilitada" : "Deshabilitada"}
                          </Label>
                          <Switch
                            id={`question-${question.id ? question.id : index}-enabled`}
                            checked={question.habilitada}
                            onCheckedChange={() => handleQuestionToggle(question.id as string, question.habilitada || false)}
                          />
                        </div>
                      )}
                      {exam && exam.estado === "borrador" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteQuestion(question.id as string)}
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
                      <QuestionContent html={question.texto} className="text-foreground" />
                      {question.retroalimentacion && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium text-muted-foreground">Retroalimentación:</span>
                          <div className="mt-1">
                            <QuestionContent html={question.retroalimentacion} className="text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {question.opciones && question.opciones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Opciones:</p>
                        <div className="space-y-2">
                          {question.opciones.map((option: OpcionRespuesta, optIndex: number) => (
                            <div key={option.id} className="flex items-center gap-2">
                              {exam && exam.estado === "publicado" ? (
                                // Para exámenes publicados, mostrar las opciones como burbujas clickeables
                                <div 
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                                    ${option.es_correcta 
                                      ? 'bg-green-500' 
                                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }
                                    ${question.habilitada ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'opacity-50'}
                                  `}
                                  onClick={() => {
                                    if (!question.habilitada || !option.id) return;
                                    // Solo permitir cambiar si no es ya la opción correcta
                                    if (!option.es_correcta) {
                                      handleCorrectAnswerChange(
                                        question.id as string,
                                        option.id as string,
                                        optIndex,
                                        index
                                      );
                                    }
                                  }}
                                >
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                              ) : (
                                // Para borradores, mantener el estilo actual
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  option.es_correcta 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-white' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                              )}
                              <p className={option.es_correcta ? 'font-medium' : ''}>{option.texto}</p>
                              {option.es_correcta && (
                                <span className="text-xs text-green-600 dark:text-green-400">(Correcta)</span>
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
      {exam && exam.estado === "borrador" && (
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
              <RichTextEditor
                key={editorKey}
                _value={currentQuestion.texto}
                onChange={(html) => {
                  setCurrentQuestion(prev => ({
                    ...prev,
                    texto: html
                  }));
                }}
                placeholder="Escribe aquí tu pregunta"
              />
            </div>

            <div className="space-y-2">
              <Label>Opciones de Respuesta</Label>
              <div className="space-y-3">
                {currentQuestion.opciones.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={option.es_correcta}
                      onChange={() => handleCorrectOption(index)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <Input
                        value={option.texto}
                        onChange={(e) => handleOptionChange(index, e)}
                        placeholder={`Opción ${index + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
              <Info className="inline h-4 w-4 mr-1" /> Solo se guardarán las opciones que tengan texto
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

      {/* Modal de confirmación para cambiar respuesta correcta */}
      <AlertDialog open={showCorrectAnswerDialog} onOpenChange={setShowCorrectAnswerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿{pendingCorrectAnswer ? 'Actualizar' : 'Cancelar'} respuesta correcta?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCorrectAnswer ? (
                'Al hacer click en Confirmar se recalcularán las calificaciones de todos los estudiantes que ya tomaron este examen.'
              ) : (
                '¿Estás seguro de que deseas cancelar la actualización de la respuesta correcta?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={pendingCorrectAnswer ? confirmChangeCorrectAnswer : () => setShowCorrectAnswerDialog(false)}>
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