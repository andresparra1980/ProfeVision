'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { OMRForm } from '@/components/exam/omr-form';
import { 
  QRData, 
  Answer, 
  EntityNames, 
  ExamScore, 
  DEFAULT_NUM_OPTIONS, 
  OPTION_LETTERS,
  DuplicateInfo
} from '../types';
import logger from '@/lib/utils/logger';

// Constants
const DEBUG = process.env.NODE_ENV === 'development';

// Use types from the shared types file
interface ResultsProps {
  qrData: QRData | null;
  answers: Answer[];
  processedImage: string | null;
  originalImage: string | null;
  processedImageData?: string | null;
  originalImageData?: string | null;
  onPrevious: () => void;
  onComplete: () => void;
  onContinue: () => void;
  onSaved: (resultadoId: string) => void;
}

interface RawAnswer {
  number?: number;
  questionNumber?: number;
  question_number?: number;
  question?: number;
  num?: number;
  value?: string;
  answerValue?: string;
  answer_value?: string;
  answer?: string;
  confidence?: number;
  num_options?: number;
  numOptions?: number;
  options_count?: number;
  disabled?: boolean;
  pregunta_id?: string;
  opcion_id?: string;
  es_correcta?: boolean;
}

interface OpcionRespuesta {
  id: string;
  orden: number;
  pregunta_id: string;
  es_correcta: boolean;
}

// Función para normalizar las respuestas
const normalizeAnswers = (rawAnswers: RawAnswer[]): Answer[] => {
  return rawAnswers.map(answer => ({
    number: answer.number || answer.questionNumber || answer.question_number || answer.question || answer.num || 0,
    value: answer.value || answer.answerValue || answer.answer_value || answer.answer || '',
    confidence: answer.confidence,
    num_options: answer.num_options || answer.numOptions || answer.options_count || DEFAULT_NUM_OPTIONS,
    disabled: answer.disabled || false,
    pregunta_id: answer.pregunta_id,
    opcion_id: answer.opcion_id,
    es_correcta: answer.es_correcta
  }));
};

export function Results({ 
  qrData, 
  answers: initialAnswers, 
  processedImage, 
  originalImage, 
  processedImageData,
  originalImageData,
  onPrevious, 
  onComplete, 
  onContinue, 
  onSaved 
}: ResultsProps) {
  // Usar una ref para registrar si ya se ha mostrado el log
  const loggedRef = useRef(false);
  
  // Log solo cuando no se haya mostrado antes
  if (DEBUG && !loggedRef.current) {
    logger.log("Results component received:", { qrData, initialAnswersCount: initialAnswers?.length, processedImage: !!processedImage });
    loggedRef.current = true;
  }
  
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

  const [answers, setAnswers] = useState<Answer[]>(normalizeAnswers(initialAnswers || []));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const { toast } = useToast();

  // Usar useMemo para evitar recálculos innecesarios
  const normalizedAnswers = useMemo(() => {
    return Array.isArray(answers) ? answers.map((answer: RawAnswer) => {
      // Si la respuesta tiene structure de {question, answer} (formato antiguo)
      if ('question' in answer && 'answer' in answer) {
        return {
          number: answer.question || 0,
          value: answer.answer || '',
          confidence: answer.confidence || 100,
          num_options: answer.num_options || DEFAULT_NUM_OPTIONS
        };
      }
      // Si la respuesta ya tiene el formato correcto {number, value}
      else if ('number' in answer && 'value' in answer) {
        return {
          ...answer,
          number: answer.number || 0,
          value: answer.value || '',
          num_options: answer.num_options || DEFAULT_NUM_OPTIONS
        };
      }
      // Intentar extraer campos si los nombres son diferentes
      else {
        const number = answer.number || answer.questionNumber || answer.question_number || answer.question || answer.num || 0;
        const value = answer.value || answer.answerValue || answer.answer_value || answer.answer || '';
        const confidence = answer.confidence || 100;
        const num_options = answer.num_options || answer.numOptions || answer.options_count || DEFAULT_NUM_OPTIONS;
        
        return { number, value, confidence, num_options };
      }
    }).filter(a => a.number > 0 && a.value !== '').sort((a, b) => a.number - b.number) : [];
  }, [answers]);

  // Crear un arreglo con las 40 posibles preguntas
  const answersMap = useMemo(() => {
    const map = new Map();
    normalizedAnswers.forEach(answer => {
      map.set(answer.number, {
        value: answer.value,
        num_options: answer.num_options || DEFAULT_NUM_OPTIONS,
        disabled: answer.disabled || false
      });
    });
    return map;
  }, [normalizedAnswers]);
  
  // Crear arrays para las dos columnas
  const _answersForDisplay = useMemo(() => {
    const map = new Map();
    for (let i = 1; i <= 40; i++) {
      map.set(i, {
        number: i,
        value: answersMap.has(i) ? answersMap.get(i).value : '-',
        num_options: answersMap.has(i) ? answersMap.get(i).num_options : DEFAULT_NUM_OPTIONS,
        disabled: answersMap.has(i) ? answersMap.get(i).disabled : false
      });
    }
    return map;
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

  // Función para calcular la puntuación del examen
  const calculateExamScore = useCallback(async (examId: string) => {
    try {
      setExamScore(prev => ({ ...prev, loading: true, error: null }));
      
      // Obtener preguntas y puntaje total del examen
      const [questionsRes, examRes] = await Promise.all([
        fetch(`/api/exams/${examId}/questions`),
        fetch(`/api/exams/${examId}/details`)
      ]);
      
      if (!questionsRes.ok) throw new Error(`Error al obtener preguntas del examen: ${questionsRes.statusText}`);
      if (!examRes.ok) throw new Error(`Error al obtener detalles del examen: ${examRes.statusText}`);
      
      const [questions, examData] = await Promise.all([
        questionsRes.json(),
        examRes.json()
      ]);
      
      // Obtener respuestas correctas para TODAS las preguntas
      const questionIds = questions.map((q: { id: string }) => q.id);
      
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
      correctAnswersData.forEach((option: OpcionRespuesta) => {
        const question = questions.find((q: { id: string, orden: number }) => q.id === option.pregunta_id);
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

      // Marcar las respuestas y asignar los IDs de pregunta y opción
      // Usamos directamente el estado actual de answers en vez de normalizedAnswers
      setAnswers(prevAnswers => {
        // Normalizar las respuestas actuales para procesamiento
        const currentAnswers = normalizeAnswers(prevAnswers);
        
        const answersWithIds = currentAnswers.map((answer: Answer): Answer => {
          const question = questions.find((q: { orden: number, id: string, habilitada: boolean }) => q.orden === answer.number);
          
          // Encontrar la opción seleccionada basada en la letra de respuesta
          let opcionId = null;
          let esCorrecta = false;
          
          if (question) {
            // Obtener el orden basado en la letra de respuesta (A=1, B=2, etc)
            const orden = OPTION_LETTERS.indexOf(answer.value.toUpperCase()) + 1;
            
            // Buscar la opción correspondiente independientemente de si está habilitada o no
            const opcionesParaPregunta = correctAnswersData.filter(
              (opt: OpcionRespuesta) => opt.pregunta_id === question.id
            );
            
            // Encontrar la opción específica que corresponde a la respuesta del estudiante
            const opcionSeleccionada = opcionesParaPregunta.find(
              (opt: OpcionRespuesta) => opt.orden === orden
            );
            
            // Asignar el ID de la opción seleccionada
            opcionId = opcionSeleccionada?.id;
            
            // Encontrar la opción correcta para esta pregunta
            const opcionCorrecta = opcionesParaPregunta.find(
              (opt: OpcionRespuesta) => opt.es_correcta
            );
            
            // Determinar si la respuesta es correcta
            esCorrecta = opcionCorrecta?.orden === orden;
          }

          return {
            ...answer,
            number: answer.number,
            value: answer.value,
            confidence: answer.confidence || 100,
            num_options: answer.num_options || DEFAULT_NUM_OPTIONS,
            disabled: question ? !question.habilitada : false,
            pregunta_id: question?.id,
            opcion_id: opcionId,
            es_correcta: esCorrecta
          };
        });
        
        // Cálculos para la calificación
        const puntajeTotal = parseFloat(examData.puntaje_total);
        const preguntasHabilitadas = questions.filter((q: { habilitada: boolean }) => q.habilitada);
        
        // Contar respuestas correctas (solo de preguntas habilitadas)
        let correctCount = 0;
        answersWithIds.forEach(answer => {
          if (!answer.disabled && answer.es_correcta) {
            correctCount++;
          }
        });
        
        // Calcular porcentaje y puntaje obtenido
        const totalQuestions = preguntasHabilitadas.length;
        const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const puntajeObtenido = (percentage / 100) * puntajeTotal;
        
        // Actualizar el estado con los nuevos cálculos
        setExamScore(prev => ({
          ...prev,
          correctAnswers: correctCount,
          totalQuestions,
          percentage,
          puntajeTotal,
          puntajeObtenido,
          loading: false,
          error: null
        }));
        
        // Devolver las respuestas actualizadas
        return answersWithIds;
      });
      
    } catch (error: unknown) {
      if (DEBUG) {
        logger.error("Error calculating exam score:", error);
      }
      setExamScore(prev => ({
        ...prev,
        correctAnswers: 0,
        totalQuestions: 0,
        percentage: 0,
        loading: false,
        error: (error as Error).message || "Error al calcular la calificación"
      }));
    }
  }, []); // Ya no depende de normalizedAnswers

  // Cargar entidades y calcular puntuación
  useEffect(() => {
    const fetchEntityNames = async () => {
      try {
        setEntityNames(prev => ({ ...prev, loading: true, error: null }));
        
        if (!qrData || 
            (!qrData.examId && !qrData.examenId && !qrData.exam_id && !qrData.examen_id) || 
            (!qrData.studentId && !qrData.estudianteId && !qrData.student_id && !qrData.estudiante_id)) {
          throw new Error("Datos QR incompletos. No se puede cargar información detallada.");
        }
        
        // Obtener IDs usando optional chaining para mejor type safety
        const examId = qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id;
        const studentId = qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id;
        const groupId = qrData.groupId || qrData.grupoId || qrData.group_id || qrData.grupo_id;
        
        // Preparar las promesas para cargar los datos
        const promises = [
          fetch(`/api/exams/${examId}/details`),
          fetch(`/api/students/${studentId}`)
        ];
        
        // Si hay ID de grupo, añadir la petición para obtener datos del grupo
        if (groupId) {
          promises.push(fetch(`/api/groups/${groupId}`));
        }
        
        // Ejecutar las promesas en paralelo
        const responses = await Promise.all(promises);
        
        // Verificar respuestas
        if (!responses[0].ok) throw new Error(`No se pudo cargar el examen: ${responses[0].statusText}`);
        if (!responses[1].ok) throw new Error(`No se pudo cargar el estudiante: ${responses[1].statusText}`);
        
        // Preparar promesas para extraer los datos JSON
        const dataPromises = [responses[0].json(), responses[1].json()];
        if (groupId && responses.length > 2) {
          dataPromises.push(responses[2].ok ? responses[2].json() : Promise.resolve(null));
        }
        
        // Obtener los datos
        const data = await Promise.all(dataPromises);
        const examData = data[0];
        const studentData = data[1];
        const groupData = data.length > 2 ? data[2] : null;
        
        // Para depuración: registrar los datos recibidos
        if (DEBUG) {
          logger.log('Datos del examen recibidos:', examData);
          logger.log('Datos del estudiante recibidos:', studentData);
          logger.log('Datos del grupo recibidos:', groupData);
        }
        
        // Calcular puntaje del examen
        if (examId) {
          calculateExamScore(examId);
        }
        
        // Actualizar los nombres de las entidades
        setEntityNames({
          materia: examData.materia?.nombre || 'No disponible',
          examen: examData.nombre || examData.titulo || examData.title || 'No disponible',
          estudiante: studentData.nombres && studentData.apellidos 
            ? `${studentData.nombres} ${studentData.apellidos}`
            : studentData.nombres || studentData.apellidos || 'No disponible',
          grupo: groupData 
            ? (groupData.nombre || groupData.name || `Grupo ${groupData.id}`)
            : (examData.grupo_id 
                ? `Grupo ID: ${examData.grupo_id}`
                : (qrData.grupo_id || qrData.groupId 
                    ? `Grupo ID: ${qrData.grupo_id || qrData.groupId}` 
                    : 'No disponible')),
          loading: false,
          error: null
        });
      } catch (error: unknown) {
        if (DEBUG) {
          logger.error("Error al cargar entidades:", error);
        }
        
        setEntityNames(prev => ({
          ...prev,
          loading: false,
          error: (error as Error).message || "Error al cargar datos de las entidades"
        }));
      }
    };
    
    if (qrData) {
      fetchEntityNames();
    }
  }, [qrData, calculateExamScore]); // Añadimos calculateExamScore a las dependencias

  // Actualizar el estado de answers cuando cambien las props
  useEffect(() => {
    // Aplicamos directamente normalizeAnswers sin referencia a normalizedAnswers
    if (initialAnswers) {
      setAnswers(normalizeAnswers(initialAnswers));
    } else {
      setAnswers([]);
    }
  }, [initialAnswers]);

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
      
      // Reemplazar localhost:3000 con la URL de producción si estamos en producción
      let fetchUrl = url;
      if (typeof window !== 'undefined') {
        // Si la URL comienza con '/', construye la URL completa usando window.location.origin
        if (url.startsWith('/')) {
          fetchUrl = `${window.location.origin}${url}`;
        }
        // Reemplazar localhost:3000 con la URL actual si estamos en producción
        else if (url.includes('localhost:3000') && !window.location.hostname.includes('localhost')) {
          fetchUrl = url.replace('http://localhost:3000', window.location.origin)
                        .replace('https://localhost:3000', window.location.origin);
        }
      }
      
      if (DEBUG) {
        logger.log('Cargando imagen desde URL:', fetchUrl);
      }
      
      // Cargar la imagen
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Error al cargar imagen: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Convertir a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error: unknown) {
      if (DEBUG) {
        logger.error('Error al cargar imagen:', error);
      }
      throw new Error('No se pudo cargar la imagen. Intente nuevamente.');
    }
  };

  // Función para guardar los resultados y subir las imágenes
  const handleSaveResults = async () => {
    try {
      setSaving(true);
      
      // Verificar que tenemos todos los datos necesarios
      if (!qrData || !answers.length || (!processedImage && !processedImageData) || (!originalImage && !originalImageData)) {
        throw new Error("Faltan datos para guardar los resultados");
      }
      
      // Usar los datos de imagen directamente si están disponibles, de lo contrario cargar desde la URL
      let originalImageBase64: string;
      let processedImageBase64: string;
      
      if (originalImageData) {
        originalImageBase64 = originalImageData;
      } else {
        if (DEBUG) {
          logger.log('Cargando imagen original desde URL...');
        }
        originalImageBase64 = await loadImageAsBase64(originalImage!);
      }
      
      if (processedImageData) {
        processedImageBase64 = processedImageData;
      } else {
        if (DEBUG) {
          logger.log('Cargando imagen procesada desde URL...');
        }
        processedImageBase64 = await loadImageAsBase64(processedImage!);
      }
      
      if (DEBUG) {
        logger.log('Imágenes preparadas correctamente');
      }
      
      // Crear una copia de las respuestas normalizadas para enviar
      const answersToSend = answers.filter(a => a.number > 0 && a.value !== '').sort((a, b) => a.number - b.number);
      
      // Preparar datos para enviar al endpoint
      const data = {
        qrData,
        answers: answersToSend,
        originalImage: originalImageBase64,
        processedImage: processedImageBase64,
        examScore,
        isDuplicate,
        duplicateInfo
      };
      
      if (DEBUG) {
        logger.log('Enviando datos al servidor...');
      }
      
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
      if (DEBUG) {
        logger.log('Respuesta del servidor:', result);
      }
      
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
      
    } catch (error: unknown) {
      if (DEBUG) {
        logger.error("Error al guardar resultados:", error);
      }
      
      // Mostrar notificación de error
      toast({
        title: "Error al guardar",
        description: (error as Error).message || "Ha ocurrido un error al guardar los resultados",
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
        
        <OMRForm
          title=""
          numQuestions={40}
          numOptions={DEFAULT_NUM_OPTIONS}
          questionsPerColumn={20}
          selectedAnswers={useMemo(() => {
            const answerMap: Record<number, string> = {};
            normalizedAnswers.forEach(answer => {
              if (answer.value && answer.value !== '-') {
                answerMap[answer.number] = answer.value;
              }
            });
            return answerMap;
          }, [normalizedAnswers])}
          disabledQuestions={useMemo(() => {
            return normalizedAnswers
              .filter(answer => answer.disabled)
              .map(answer => answer.number);
          }, [normalizedAnswers])}
          showHeaders={false}
        />
        
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
                Calificación: {examScore.puntajeObtenido?.toFixed(2)}/{examScore.puntajeTotal?.toFixed(2)} ({examScore.correctAnswers}/{examScore.totalQuestions} correctas)
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