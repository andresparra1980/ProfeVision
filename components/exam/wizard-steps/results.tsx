'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
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
  onPrevious: () => void;
  onComplete: () => void;
  onContinue: () => void;
  onSaved: (_resultadoId: string) => void;
}

// Local definition if OpcionRespuesta was removed from shared types
interface OpcionRespuesta {
  id: string;
  orden: number;
  pregunta_id: string;
  es_correcta: boolean;
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

export function Results({ qrData, answers: initialAnswers, processedImage, originalImage, onPrevious, onComplete, onContinue, onSaved }: ResultsProps) {
  const t = useTranslations('wizard-step-results');
  // Usar una ref para registrar si ya se ha mostrado el log
  const loggedRef = useRef(false);
  
  // Log solo cuando no se haya mostrado antes
  if (DEBUG && !loggedRef.current) {
    logger.log("Results component received:", { 
      qrData, 
      initialAnswersCount: initialAnswers?.length, 
      processedImage: processedImage ? `${processedImage.substring(0, 50)}...` : null,
      originalImage: originalImage ? `${originalImage.substring(0, 50)}...` : null
    });
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

  const selectedAnswersForOMR = useMemo(() => {
    // if (DEBUG) console.log('[Results] Memoizing selectedAnswersForOMR', answers);
    const record: Record<number, string> = {};
    answers.forEach(answer => {
      if (answer.value && answer.value !== '-') {
        record[answer.number] = answer.value;
      }
    });
    return record;
  }, [answers]);

  const disabledQuestionsForOMR = useMemo(() => {
    // if (DEBUG) console.log('[Results] Memoizing disabledQuestionsForOMR', answers);
    return answers
      .filter(answer => answer.disabled)
      .map(answer => answer.number);
  }, [answers]);

  const omrDisplayNumQuestions = useMemo(() => {
    // if (DEBUG) console.log('[Results] Memoizing omrDisplayNumQuestions', answers);
    return answers && answers.length > 0 ? Math.max(0, ...answers.map(a => a.number)) : 0;
  }, [answers]);

  const correctnessMap = useMemo(() => {
    // if (DEBUG) console.log('[Results] Memoizing correctnessMap', answers);
    const map: Record<number, boolean | undefined> = {};
    answers.forEach(answer => {
      map[answer.number] = answer.es_correcta;
    });
    return map;
  }, [answers]);

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
        error: (error as Error).message || t('errors.calculatingGrade')
      }));
    }
  }, [t]); // Ya no depende de normalizedAnswers

  // Cargar entidades y calcular puntuación
  useEffect(() => {
    const fetchEntityNames = async () => {
      try {
        setEntityNames(prev => ({ ...prev, loading: true, error: null }));
        
        // Validar que tenemos datos QR
        if (!qrData) {
          throw new Error(t('errors.noQRData'));
        }
        
        // Extraer IDs usando optional chaining para mejor type safety
        const examId = qrData.examId;
        const studentId = qrData.studentId;
        const groupId = qrData.groupId;
        
        // Validar IDs requeridos
        const missingIds = [];
        if (!examId) missingIds.push('examen');
        if (!studentId) missingIds.push('estudiante');
        
        if (missingIds.length > 0) {
          throw new Error(`Datos QR incompletos. Falta identificador de: ${missingIds.join(', ')}.`);
        }
        
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
        
        // Verificar respuestas y preparar mensajes de error específicos
        if (!responses[0].ok) {
          throw new Error(`No se pudo cargar la información del examen (${responses[0].status}): ${responses[0].statusText}`);
        }
        if (!responses[1].ok) {
          throw new Error(`No se pudo cargar la información del estudiante (${responses[1].status}): ${responses[1].statusText}`);
        }
        if (groupId && responses[2] && !responses[2].ok) {
          logger.warn(`No se pudo cargar la información del grupo (${responses[2].status}): ${responses[2].statusText}`);
        }
        
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
          if (groupData) logger.log('Datos del grupo recibidos:', groupData);
        }
        
        // Calcular puntaje del examen
        if (examId && typeof examId === 'string') {
          calculateExamScore(examId);
        }
        
        // Actualizar los nombres de las entidades con manejo de casos nulos
        setEntityNames({
                  materia: examData.materia?.nombre || t('examInfo.notAvailable'),
        examen: examData.nombre || examData.titulo || examData.title || t('examInfo.notAvailable'),
                      estudiante: studentData.nombres && studentData.apellidos 
              ? `${studentData.nombres} ${studentData.apellidos}`
              : studentData.nombres || studentData.apellidos || t('examInfo.notAvailable'),
          grupo: groupData 
            ? (groupData.nombre || groupData.name || `Grupo ${groupData.id}`)
            : (examData.grupo_id 
                ? `Grupo ID: ${examData.grupo_id}`
                : (qrData.grupo_id || qrData.groupId 
                    ? `Grupo ID: ${qrData.grupo_id || qrData.groupId}` 
                    : t('examInfo.notAvailable'))),
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
          error: error instanceof Error ? error.message : t('errors.loadingEntities')
        }));
      }
    };
    
    if (qrData) {
      fetchEntityNames();
    }
  }, [qrData, calculateExamScore, t]); // Añadimos calculateExamScore a las dependencias

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
      // Si ya es un data URL, devolverlo directamente
      if (url.startsWith('data:')) {
        if (DEBUG) {
          logger.log('La imagen ya es un data URL, devolviéndola directamente');
        }
        return url;
      }
      
      if (DEBUG) {
        logger.log('Procesando imagen para convertir a base64:', url);
      }
      
      // Determinar la URL final para cargar la imagen
      let finalUrl = url;
      
      // Caso 1: URLs absolutas con localhost
      if (url.includes('localhost:3000') && typeof window !== 'undefined') {
        // Reemplazar localhost con el origen actual
        finalUrl = url.replace(/https?:\/\/localhost:3000/g, window.location.origin);
        if (DEBUG) {
          logger.log('URL de localhost reescrita:', finalUrl);
        }
      } 
      // Caso 2: URLs relativas que empiezan con /uploads
      else if (url.startsWith('/uploads/') && typeof window !== 'undefined') {
        // Convertir a URL absoluta
        finalUrl = `${window.location.origin}${url}`;
        if (DEBUG) {
          logger.log('URL relativa convertida a absoluta:', finalUrl);
        }
      }
      // Caso 3: URLs que contienen /uploads/ pero no son relativas ni localhost
      else if (url.includes('/uploads/') && !url.startsWith('http') && typeof window !== 'undefined') {
        // Asumir que es una ruta relativa que no comienza con /
        finalUrl = `${window.location.origin}/${url}`;
        if (DEBUG) {
          logger.log('URL parcial convertida a absoluta:', finalUrl);
        }
      }
      
      try {
        // Intentar fetch con la URL corregida
        if (DEBUG) {
          logger.log('Intentando fetch de la imagen desde:', finalUrl);
        }
        
        const response = await fetch(finalUrl, { 
          mode: 'cors',
          cache: 'no-cache',
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar imagen: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        if (DEBUG) {
          logger.log('Imagen cargada correctamente, tamaño:', blob.size, 'bytes, tipo:', blob.type);
        }
        
        // Comprimir la imagen antes de convertirla a base64
        const compressedBlob = await compressImage(blob);
        
        // Convertir a base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Error al leer el archivo'));
          reader.readAsDataURL(compressedBlob);
        });
      } catch (fetchError) {
        // Si falla el fetch por CORS, intentar cargar la imagen usando createElement
        if (DEBUG) {
          logger.log('Fetch falló, intentando método alternativo con Image:', fetchError);
        }
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('No se pudo obtener contexto de canvas'));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          
          img.onerror = () => {
            // Si falla la carga de imagen, intentar con una variante de la URL como último recurso
            if (finalUrl !== url && !finalUrl.includes('localhost')) {
              // Intentar con la URL original si la modificada falló
              logger.warn('Falló carga con URL modificada, intentando URL original:', url);
              img.src = url;
              return;
            }
            
            if (DEBUG) {
              logger.error('No se pudo cargar la imagen:', finalUrl);
            }
            reject(new Error(`No se pudo cargar la imagen: ${finalUrl}`));
          };
          
          img.src = finalUrl;
        });
      }
    } catch (error) {
      if (DEBUG) {
        logger.error('Error al cargar imagen como base64:', error);
      }
      throw new Error(`Error al cargar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  // Función para comprimir una imagen
  const compressImage = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Escalar la imagen si es muy grande
        let width = img.width;
        let height = img.height;
        const maxSize = 1200; // Tamaño máximo en píxeles
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        // Dibujar la imagen en el canvas con el nuevo tamaño
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a Blob con calidad reducida
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          0.7 // Calidad del 70%
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'));
      
      // Crear URL a partir del Blob
      img.src = URL.createObjectURL(blob);
    });
  };

  // Función para guardar los resultados y subir las imágenes
  const handleSaveResults = async () => {
    try {
      setSaving(true);
      
      // Verificar que tenemos todos los datos necesarios
      if (!qrData || !answers.length || !processedImage || !originalImage || !examScore) {
        throw new Error(t('errors.saveResults'));
      }
      
      // Verificar si tenemos URLs diferentes para las imágenes
      const imagesAreSame = originalImage === processedImage;
      
      // Convertir imágenes a base64 si son URLs
      if (DEBUG) {
        logger.log('Preparando imágenes para guardar...', {
          originalImage: originalImage ? `${originalImage.substring(0, 50)}...` : null,
          processedImage: processedImage ? `${processedImage.substring(0, 50)}...` : null,
          areEqual: imagesAreSame,
          originalIsDataUrl: originalImage?.startsWith('data:'),
          processedIsDataUrl: processedImage?.startsWith('data:'),
          environment: process.env.NODE_ENV
        });
      }
      
      // Comprobación adicional: si las imágenes son iguales cuando no deberían serlo
      if (imagesAreSame && !originalImage?.startsWith('data:')) {
        logger.warn('¡Advertencia! Las URLs de la imagen original y procesada son idénticas:', 
          originalImage?.substring(0, 50)
        );
        
        // En producción, intentar usar diferentes métodos para cargar las imágenes
        if (process.env.NODE_ENV === 'production') {
          logger.log('Estamos en producción, intentando trabajar con la misma imagen de forma diferente');
        }
      }
      
      let originalImageBase64, processedImageBase64;
      try {
        // Cargar la imagen original
        originalImageBase64 = await loadImageAsBase64(originalImage);
        
        // Si las imágenes son diferentes, cargar la procesada normalmente
        if (!imagesAreSame) {
          processedImageBase64 = await loadImageAsBase64(processedImage);
        } 
        // Si son la misma imagen pero ya es un data URL, intentar modificar ligeramente la procesada
        else if (originalImage?.startsWith('data:')) {
          logger.log('Las imágenes son idénticas data URLs, intentando diferenciar la procesada');
          processedImageBase64 = originalImageBase64;
        } 
        // Si son la misma imagen pero son URLs, intentar forzar que sean diferentes
        else {
          logger.log('Las imágenes son idénticas URLs, intentando cargar la procesada con parámetros diferentes');
          // Añadir timestamp como query param para forzar carga diferente
          const processedWithParams = `${processedImage}${processedImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
          processedImageBase64 = await loadImageAsBase64(processedWithParams);
        }
        
        if (DEBUG) {
          const originalPrefix = originalImageBase64.substring(0, 30);
          const processedPrefix = processedImageBase64.substring(0, 30);
          
          logger.log('Imágenes preparadas correctamente', {
            originalLength: originalImageBase64.length,
            processedLength: processedImageBase64.length,
            originalPrefix: `${originalPrefix}...`,
            processedPrefix: `${processedPrefix}...`,
            areEqual: originalImageBase64 === processedImageBase64
          });
        }
        
        // Verificación adicional: si las imágenes convertidas son idénticas pero las URLs originales no lo eran
        if (originalImageBase64 === processedImageBase64 && !imagesAreSame) {
          logger.warn('¡Advertencia! Las imágenes convertidas son idénticas aunque las URLs no lo eran');
        }
        
      } catch (imageError) {
        logger.error('Error al procesar imágenes:', imageError);
        throw new Error(`Error al preparar imágenes: ${imageError instanceof Error ? imageError.message : 'Error desconocido'}`);
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
      
      try {
        // Enviar datos al endpoint con timeout para evitar esperas indefinidas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
        
        const response = await fetch('/api/exams/save-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        // Limpiar timeout
        clearTimeout(timeoutId);
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          let errorMessage = t('errors.saveResults');
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              console.error('Detalles del error:', errorData.details);
            }
          } catch (parseError) {
            console.error('Error al parsear respuesta de error:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        // Leer la respuesta como texto primero para validar
        const responseText = await response.text();
        if (!responseText) {
          throw new Error(t('errors.serverEmptyResponse'));
        }
        
        // Parsear la respuesta JSON después de verificar que no está vacía
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Error al procesar respuesta: ${parseError instanceof Error ? parseError.message : t('errors.formatError')}`);
        }
        
        if (DEBUG) {
          logger.log('Respuesta del servidor:', result);
        }
        
        // Mostrar notificación de éxito
              toast({
        title: isDuplicate ? t('toasts.resultsUpdated') : t('toasts.resultsSaved'),
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
      } catch (fetchError) {
        // Manejar errores específicos de la petición
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error(t('errors.timeoutError'));
        }
        throw fetchError;
      }
      
    } catch (error: unknown) {
      if (DEBUG) {
        logger.error("Error al guardar resultados:", error);
      }
      
      // Mostrar notificación de error
      toast({
        title: t('toasts.saveError'),
        description: (error as Error).message || t('toasts.saveErrorDescription'),
        variant: "destructive",
      });
      
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      
      {entityNames.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {entityNames.error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">{t('examInfo.title')}</h4>
        
        {entityNames.loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t('examInfo.loading')}</span>
          </div>
        ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t('examInfo.fields.subject')}</p>
                <p className="font-medium">{entityNames.materia}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('examInfo.fields.exam')}</p>
                <p className="font-medium">{entityNames.examen}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('examInfo.fields.student')}</p>
                <p className="font-medium">{entityNames.estudiante}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('examInfo.fields.group')}</p>
                <p className="font-medium">{entityNames.grupo}</p>
              </div>
            </div>
        )}
      </div>
      
      <div className="rounded-lg border p-4">
        <h4 className="font-medium mb-2">{t('answers.title')}</h4>
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
          numQuestions={omrDisplayNumQuestions}
          numOptions={DEFAULT_NUM_OPTIONS}
          questionsPerColumn={20}
          selectedAnswers={selectedAnswersForOMR}
          disabledQuestions={disabledQuestionsForOMR}
          correctnessMap={correctnessMap}
          showHeaders={false}
        />
        
        {examScore.loading ? (
          <div className="flex items-center justify-center py-4 mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t('grading.calculating')}</span>
          </div>
        ) : examScore.error ? (
          <div className="mt-4 text-center text-red-500 text-sm">
            <span>{t('grading.error')} {examScore.error}</span>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <div className="bg-green-100 rounded-lg inline-flex items-center px-4 py-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 font-semibold">
                {t('grading.label')} {examScore.puntajeObtenido?.toFixed(2)}/{examScore.puntajeTotal?.toFixed(2)} ({examScore.correctAnswers}/{examScore.totalQuestions} {t('grading.correctAnswers')})
              </span>
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onPrevious} disabled={saving}>
          {t('buttons.back')}
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
                {t('buttons.saving')}
              </>
            ) : (
              t('buttons.saveResults')
            )}
          </Button>
        ) : (
          <div className="space-x-2 flex">
            <div className="flex items-center mr-2 bg-green-100 px-3 py-1 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 text-sm font-medium">{t('buttons.savedSuccessfully')}</span>
            </div>
                          <Button 
                variant="secondary" 
                onClick={onContinue}>
                {t('buttons.scanAnother')}
              </Button>
              <Button 
                variant="default" 
                onClick={onComplete}>
                {t('buttons.finish')}
              </Button>
          </div>
        )}
      </div>
    </div>
  );
} 