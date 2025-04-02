'use client';

import { useEffect, useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface ResultsProps {
  qrData: any;
  answers: any[];
  processedImage: string | null;
  originalImage: string | null;
  onPrevious: () => void;
  onComplete: () => void;
  onContinue: () => void;
  onSaved: (resultadoId: string) => void;
}

interface EntityNames {
  materia: string;
  examen: string;
  estudiante: string;
  grupo: string;
  loading: boolean;
  error: string | null;
}

interface ExamScore {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  loading: boolean;
  error: string | null;
}

interface Answer {
  number: number;
  value: string;
  confidence?: number;
  num_options?: number;
}

export function Results({ qrData, answers, processedImage, originalImage, onPrevious, onComplete, onContinue, onSaved }: ResultsProps) {
  console.log("Results component received:", { qrData, answers, processedImage });
  
  const [entityNames, setEntityNames] = useState<EntityNames>({
    materia: '',
    examen: '',
    estudiante: '',
    grupo: '',
    loading: true,
    error: null
  });

  const [examScore, setExamScore] = useState<ExamScore>({
    correctAnswers: 0,
    totalQuestions: 0,
    percentage: 0,
    loading: true,
    error: null
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const { toast } = useToast();

  // Valor por defecto para el número de opciones (si no se especifica)
  const DEFAULT_NUM_OPTIONS = 4;
  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Soportamos hasta 8 opciones

  // Usar useMemo para evitar recálculos innecesarios
  const normalizedAnswers = useMemo(() => {
    return Array.isArray(answers) ? answers.map(answer => {
      // Si la respuesta tiene structure de {question, answer} (formato antiguo)
      if ('question' in answer && 'answer' in answer) {
        return {
          number: answer.question,
          value: answer.answer,
          confidence: answer.confidence || 100,
          num_options: answer.num_options || DEFAULT_NUM_OPTIONS
        };
      }
      // Si la respuesta ya tiene el formato correcto {number, value}
      else if ('number' in answer && 'value' in answer) {
        return {
          ...answer,
          num_options: answer.num_options || DEFAULT_NUM_OPTIONS
        };
      }
      // Intentar extraer campos si los nombres son diferentes
      else {
        const number = answer.number || answer.questionNumber || answer.question_number || answer.question || answer.num || null;
        const value = answer.value || answer.answerValue || answer.answer_value || answer.answer || null;
        const confidence = answer.confidence || answer.conf || 100;
        const num_options = answer.num_options || answer.numOptions || answer.options_count || DEFAULT_NUM_OPTIONS;
        
        return { number, value, confidence, num_options };
      }
    }).filter(a => a.number !== null && a.value !== null).sort((a, b) => a.number - b.number) : [];
  }, [answers]);

  // Crear un arreglo con las 40 posibles preguntas
  const answersMap = useMemo(() => {
    const map = new Map();
    normalizedAnswers.forEach(answer => {
      map.set(answer.number, {
        value: answer.value,
        num_options: answer.num_options || DEFAULT_NUM_OPTIONS
      });
    });
    return map;
  }, [normalizedAnswers]);
  
  // Crear arrays para las dos columnas
  const { answersFirstColumn, answersSecondColumn } = useMemo(() => {
    const first = Array.from({ length: 20 }, (_, i) => {
      const questionNumber = i + 1;
      return {
        number: questionNumber,
        value: answersMap.has(questionNumber) ? answersMap.get(questionNumber).value : '-',
        num_options: answersMap.has(questionNumber) ? answersMap.get(questionNumber).num_options : DEFAULT_NUM_OPTIONS
      };
    });
    
    const second = Array.from({ length: 20 }, (_, i) => {
      const questionNumber = i + 21;
      return {
        number: questionNumber,
        value: answersMap.has(questionNumber) ? answersMap.get(questionNumber).value : '-',
        num_options: answersMap.has(questionNumber) ? answersMap.get(questionNumber).num_options : DEFAULT_NUM_OPTIONS
      };
    });
    
    return { answersFirstColumn: first, answersSecondColumn: second };
  }, [answersMap]);

  // Al cargar el componente, comprobar si es un duplicado
  useEffect(() => {
    if (qrData && 'isDuplicate' in qrData && qrData.isDuplicate) {
      setIsDuplicate(true);
      if ('duplicateInfo' in qrData && qrData.duplicateInfo) {
        setDuplicateInfo(qrData.duplicateInfo);
      }
    }
  }, [qrData]);

  useEffect(() => {
    async function fetchEntityNames() {
      setEntityNames(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        if (!qrData) {
          throw new Error("No hay datos de QR disponibles");
        }
        
        const examId = qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id;
        const studentId = qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id;
        const groupId = qrData.groupId || qrData.grupoId || qrData.group_id || qrData.grupo_id;
        
        if (!examId || !studentId) {
          throw new Error("Datos de QR incompletos");
        }
        
        // Fetch exam details (includes subject)
        const examRes = await fetch(`/api/exams/${examId}/details`);
        if (!examRes.ok) throw new Error(`Error al obtener detalles del examen: ${examRes.statusText}`);
        const examData = await examRes.json();
        
        // Fetch student details
        const studentRes = await fetch(`/api/students/${studentId}`);
        if (!studentRes.ok) throw new Error(`Error al obtener detalles del estudiante: ${studentRes.statusText}`);
        const studentData = await studentRes.json();
        
        let groupData = null;
        // Fetch group details if available
        if (groupId) {
          const groupRes = await fetch(`/api/groups/${groupId}`);
          if (groupRes.ok) {
            groupData = await groupRes.json();
          }
        }
        
        setEntityNames({
          materia: examData.materia?.nombre || 'No disponible',
          examen: examData.titulo || examData.title || 'No disponible',
          estudiante: studentData.nombre_completo || `${studentData.nombre || ''} ${studentData.apellido || ''}`.trim() || 'No disponible',
          grupo: groupData?.nombre || 'No asignado',
          loading: false,
          error: null
        });
        
        // Ahora calculamos la calificación
        await calculateExamScore(examId);
        
      } catch (error: any) {
        console.error("Error fetching entity names:", error);
        setEntityNames(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Error al cargar datos de las entidades"
        }));
      }
    }
    
    async function calculateExamScore(examId: string) {
      try {
        setExamScore(prev => ({ ...prev, loading: true, error: null }));
        
        // Obtener preguntas del examen
        const questionsRes = await fetch(`/api/exams/${examId}/questions`);
        if (!questionsRes.ok) throw new Error(`Error al obtener preguntas del examen: ${questionsRes.statusText}`);
        const questions = await questionsRes.json();
        
        // Extraer IDs de las preguntas
        const questionIds = questions.map((q: any) => q.id);
        
        // Obtener respuestas correctas para cada pregunta
        const correctAnswersRes = await fetch('/api/opciones-respuesta/correct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionIds }),
        });
        
        if (!correctAnswersRes.ok) throw new Error(`Error al obtener respuestas correctas: ${correctAnswersRes.statusText}`);
        const correctAnswersData = await correctAnswersRes.json();
        
        // Mapear respuestas correctas por orden de pregunta
        const correctAnswersMap = new Map();
        correctAnswersData.forEach((option: any) => {
          const question = questions.find((q: any) => q.id === option.pregunta_id);
          if (question && option.es_correcta) {
            let letterAnswer = '';
            switch (option.orden) {
              case 1: letterAnswer = 'A'; break;
              case 2: letterAnswer = 'B'; break;
              case 3: letterAnswer = 'C'; break;
              case 4: letterAnswer = 'D'; break;
              case 5: letterAnswer = 'E'; break;
              case 6: letterAnswer = 'F'; break;
              case 7: letterAnswer = 'G'; break;
              case 8: letterAnswer = 'H'; break;
              default: letterAnswer = '';
            }
            correctAnswersMap.set(question.orden, letterAnswer);
          }
        });
        
        // Contar respuestas correctas
        let correctCount = 0;
        normalizedAnswers.forEach(answer => {
          const correctAnswer = correctAnswersMap.get(answer.number);
          if (answer.value && correctAnswer && answer.value.toUpperCase() === correctAnswer) {
            correctCount++;
          }
        });
        
        // Calcular porcentaje
        const totalQuestions = correctAnswersMap.size;
        const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        
        setExamScore({
          correctAnswers: correctCount,
          totalQuestions,
          percentage,
          loading: false,
          error: null
        });
        
      } catch (error: any) {
        console.error("Error calculando calificación:", error);
        setExamScore(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Error al calcular la calificación"
        }));
      }
    }
    
    if (qrData) {
      fetchEntityNames();
    }
  }, [qrData]); // Eliminar normalizedAnswers de las dependencias

  // Función para obtener el color de la burbuja según la opción
  const getAnswerBubbleStyle = (value: string) => {
    if (value === '-') return 'bg-gray-200';
    
    switch (value.toUpperCase()) {
      case 'A': return 'bg-blue-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-purple-500';
      case 'E': return 'bg-pink-500';
      case 'F': return 'bg-indigo-500';
      case 'G': return 'bg-red-500';
      case 'H': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  // Renderizar las burbujas para una respuesta
  const renderAnswerBubbles = (answer: Answer) => {
    const numOptions = answer.num_options || DEFAULT_NUM_OPTIONS;
    const options = OPTION_LETTERS.slice(0, numOptions);
    
    return (
      <div className="flex items-center space-x-1">
        {options.map((letter) => {
          const isSelected = answer.value.toUpperCase() === letter;
          return (
            <div 
              key={`bubble-${answer.number}-${letter}`}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200'}`}
            >
              {isSelected ? letter : ''}
            </div>
          );
        })}
      </div>
    );
  };

  // Función para cargar imagen desde URL y convertirla a base64
  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      // Verificar si ya es un string base64
      if (url.startsWith('data:image/')) {
        return url;
      }
      
      // Verificar si es una URL válida
      const isValidUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      if (!isValidUrl) {
        throw new Error(`URL de imagen no válida: ${url}`);
      }
      
      // Cargar la imagen
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convertir a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error al cargar imagen:', error);
      throw new Error('No se pudo cargar la imagen. Intente nuevamente.');
    }
  };

  // Función para guardar los resultados y subir las imágenes
  const handleSaveResults = async () => {
    try {
      setSaving(true);
      
      // Verificar que tenemos todos los datos necesarios
      if (!qrData || !normalizedAnswers.length || !processedImage || !originalImage || !examScore) {
        throw new Error("Faltan datos para guardar los resultados");
      }
      
      // Convertir imágenes a base64 si son URLs
      console.log('Preparando imágenes para guardar...');
      const originalImageBase64 = await loadImageAsBase64(originalImage);
      const processedImageBase64 = await loadImageAsBase64(processedImage);
      
      console.log('Imágenes preparadas correctamente');
      
      // Preparar datos para enviar al endpoint
      const data = {
        qrData,
        answers: normalizedAnswers,
        originalImage: originalImageBase64,
        processedImage: processedImageBase64,
        examScore,
        isDuplicate,
        duplicateInfo
      };
      
      console.log('Enviando datos al servidor...');
      
      // Enviar datos al endpoint
      const response = await fetch('/api/exams/save-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar los resultados");
      }
      
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      // Mostrar notificación de éxito
      toast({
        title: isDuplicate ? "Resultados actualizados" : "Resultados guardados",
        description: isDuplicate 
          ? `La calificación anterior ha sido reemplazada correctamente.`
          : `La calificación del examen ha sido registrada correctamente.`,
        variant: "default",
      });
      
      // Marcar como guardado
      setSaved(true);
      setSaving(false);
      
      // Notificar al padre que se guardó y pasar el ID del resultado
      if (result && result.resultado_id) {
        onSaved(result.resultado_id);
      }
      
    } catch (error: any) {
      console.error("Error al guardar resultados:", error);
      
      // Mostrar notificación de error
      toast({
        title: "Error al guardar",
        description: error.message || "Ha ocurrido un error al guardar los resultados",
        variant: "destructive",
      });
      
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Revisa los resultados del escaneo. Puedes volver atrás para escanear nuevamente si es necesario.
        </p>
      </div>
      
      {entityNames.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {entityNames.error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">Información del Examen</h4>
        
        {entityNames.loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando información...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Materia:</p>
              <p className="font-medium">{entityNames.materia}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Examen:</p>
              <p className="font-medium">{entityNames.examen}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estudiante:</p>
              <p className="font-medium">{entityNames.estudiante}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Grupo:</p>
              <p className="font-medium">{entityNames.grupo}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">Respuestas</h4>
        <div className="flex justify-center mb-2 text-sm">
          <div className="flex items-center mr-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-1"></div>
            <span>A</span>
          </div>
          <div className="flex items-center mr-3">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-1"></div>
            <span>B</span>
          </div>
          <div className="flex items-center mr-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-1"></div>
            <span>C</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-purple-500 mr-1"></div>
            <span>D</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            {answersFirstColumn.map((answer) => (
              <div key={`answer-${answer.number}`} className="flex items-center">
                <span className="text-sm font-medium min-w-[25px]">{answer.number}.</span>
                {answer.value !== '-' ? (
                  renderAnswerBubbles(answer)
                ) : (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: answer.num_options || DEFAULT_NUM_OPTIONS }).map((_, i) => (
                      <div 
                        key={`empty-bubble-${answer.number}-${i}`}
                        className="w-5 h-5 rounded-full bg-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {answersSecondColumn.map((answer) => (
              <div key={`answer-${answer.number}`} className="flex items-center">
                <span className="text-sm font-medium min-w-[25px]">{answer.number}.</span>
                {answer.value !== '-' ? (
                  renderAnswerBubbles(answer)
                ) : (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: answer.num_options || DEFAULT_NUM_OPTIONS }).map((_, i) => (
                      <div 
                        key={`empty-bubble-${answer.number}-${i}`}
                        className="w-5 h-5 rounded-full bg-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {examScore.loading ? (
          <div className="flex items-center justify-center py-4 mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Calculando calificación...</span>
          </div>
        ) : examScore.error ? (
          <div className="mt-4 text-center text-red-500 text-sm">
            <span>Error al calcular calificación: {examScore.error}</span>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <div className="bg-green-100 rounded-lg inline-flex items-center px-4 py-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 font-semibold">
                Calificación: {examScore.percentage.toFixed(2)}% ({examScore.correctAnswers}/{examScore.totalQuestions})
              </span>
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onPrevious} disabled={saving}>
          Atrás
        </Button>
        
        {!saved ? (
          <Button 
            variant="default" 
            onClick={handleSaveResults} 
            disabled={saving || examScore.loading || entityNames.loading || examScore.error !== null}
            className="bg-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Resultados'
            )}
          </Button>
        ) : (
          <div className="space-x-2 flex">
            <div className="flex items-center mr-2 bg-green-100 px-3 py-1 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 text-sm font-medium">Guardado exitosamente</span>
            </div>
            <Button 
              variant="secondary" 
              onClick={onContinue}>
              Escanear Otro
            </Button>
            <Button 
              variant="default" 
              onClick={onComplete}>
              Finalizar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 