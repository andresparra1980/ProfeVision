"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ExamScanner } from '@/components/exam/exam-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2, XCircle, QrCode, AlertTriangle, Check, CircleAlert, RefreshCcw, FileSearch, Wrench } from 'lucide-react';
import { decodeQRData } from '@/lib/utils/qr-code';
import { translateQRData, QREntities } from '@/lib/utils/qr-translation';
import Link from 'next/link';
import ConnectionDiagnostic from '@/components/exam/connection-diagnostic';
import logger from '@/lib/utils/logger';

const DEBUG = process.env.NODE_ENV === 'development';

// Datos de fallback para cuando no se puede cargar la información del examen
const _fallbackExamData = {
  id: 'fallback-exam',
  title: 'Examen (Modo Fallback)',
  subject: {
    id: 'fallback-subject',
    name: 'Materia no disponible',
  },
  numQuestions: 0,
};

// Tipos para los datos del OMR
interface OMRAnswer {
  number: number;
  value: string;
  confidence: number;
  num_options: number;
}

interface _OMRResult {
  success: boolean;
  qr_data: string;
  total_questions: number;
  answered_questions: number;
  answers: OMRAnswer[];
  error?: string;
  error_details?: {
    type: string;
    code: string;
    message: string;
    recommendations: string[];
  };
}

// Definir los tipos faltantes
interface AnswerResult {
  number: number;
  value: string;
  confidence: number;
  num_options?: number;
}

interface ErrorDetails {
  type: string;
  code: string;
  message: string;
  recommendations: string[];
}

// Tipos más detallados para la respuesta de la API OMR
interface QRValidation {
  isValid: boolean;
  matchesExam: boolean;
  matchesStudent: boolean;
  message?: string;
}

interface QRData {
  examId: string;
  studentId: string;
  groupId?: string;
  checksum?: string;
  raw?: string;
  isManual?: boolean;
}

interface ScanResult {
  success: boolean;
  message?: string;
  errorCode?: string;
  error?: string;
  qrData?: QRData | string;
  qr_data?: QRData | string;
  qr_validation?: QRValidation;
  total_questions?: number;
  answered_questions?: number;
  answers?: AnswerResult[];
  error_details?: ErrorDetails;
  publicUrl?: string;
  processedImageUrl?: string;
}

// Componente para mostrar información detallada del QR en la página de resultados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ScanQRInfo = ({ qrData, qrValidation, examId }: { qrData: any; qrValidation?: QRValidation; examId: string }) => {
  // Si qrData ya es un objeto (por el procesamiento en el endpoint)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let decodedData: any = qrData;
  let rawData: string = '';
  let validation: QRValidation | undefined = qrValidation;
  
  // Estado para guardar los nombres de las entidades (examen, estudiante, grupo)
  const [entityNames, setEntityNames] = useState<QREntities>({});
  const [isLoadingNames, setIsLoadingNames] = useState<boolean>(false);
  
  if (typeof qrData === 'string') {
    // Mantener la compatibilidad con el procesamiento antiguo
    decodedData = decodeQRData(qrData);
    rawData = qrData;
    validation = {
      isValid: Boolean(decodedData?.isValid),
      matchesExam: decodedData?.examId === examId,
      matchesStudent: true // No podemos saber esto con el formato antiguo
    };
  } else if (qrData && qrData.raw) {
    // Si es el nuevo formato procesado por el endpoint
    rawData = qrData.raw;
    decodedData = {
      examId: qrData.examId,
      studentId: qrData.studentId,
      groupId: qrData.groupId,
      hash: qrData.checksum,
      isValid: validation?.isValid || Boolean(qrData.checksum) // Asumimos validez basada en validación o presencia de checksum
    };
  } else if (qrData) {
    // Si es un objeto pero no tiene el formato esperado
    decodedData = qrData;
    rawData = JSON.stringify(qrData);
  }
  
  // Efecto para cargar los nombres de las entidades cuando se recibe un QR válido
  useEffect(() => {
    // Evitar llamadas innecesarias si no hay datos o si los datos están vacíos
    if (!decodedData || !decodedData.examId) return;
    
    // Verificar si ya tenemos los nombres para estos IDs para evitar llamadas duplicadas
    const currentExamId = decodedData.examId;
    const currentStudentId = decodedData.studentId;
    const currentGroupId = decodedData.groupId;
    
    // Usar una ref para evitar múltiples llamadas con los mismos datos
    // No la usamos directamente pero la dejamos comentada como referencia
    // const _requestIdKey = `${currentExamId}-${currentStudentId}-${currentGroupId}`;

    // Si ya hay una carga en progreso para estos IDs, salir
    if (isLoadingNames) return;
    
    // Función asíncrona para cargar los nombres
    async function loadEntityNames() {
      setIsLoadingNames(true);
      try {
        if (DEBUG) {
          logger.log('Cargando nombres para entidades:', {
            examId: currentExamId,
            studentId: currentStudentId,
            groupId: currentGroupId
          });
        }
        
        const names = await translateQRData(
          currentExamId, 
          currentStudentId, 
          currentGroupId
        );
        
        // Solo actualizar el estado si los datos siguen siendo los mismos
        // (para manejar casos donde el QR cambia durante la carga)
        if (decodedData.examId === currentExamId) {
          setEntityNames(names);
        }
      } catch (error) {
        logger.error('Error al cargar nombres de entidades:', error);
      } finally {
        setIsLoadingNames(false);
      }
    }
    
    loadEntityNames();
    
  }, [decodedData, isLoadingNames, decodedData?.examId, decodedData?.studentId, decodedData?.groupId]);
  
  if (!decodedData) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error en el código QR</AlertTitle>
        <AlertDescription>
          El formato del código QR no es reconocido o está dañado.
          Intente escanear nuevamente con mejor iluminación.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Usar la validación proporcionada por el backend si está disponible
  const isValid = validation?.isValid ?? decodedData.isValid;
  const matchesExam = validation?.matchesExam ?? (decodedData.examId === examId);
  const matchesStudent = validation?.matchesStudent ?? true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-primary" />
          <h3 className="font-semibold">Información del código QR</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isValid ? 'Válido' : 'Inválido'}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${matchesExam ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
            {matchesExam ? 'Coincide con examen' : 'No coincide con examen'}
          </span>
          {qrValidation && (
            <span className={`px-2 py-1 text-xs rounded-full ${matchesStudent ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {matchesStudent ? 'Estudiante verificado' : 'Estudiante diferente'}
            </span>
          )}
        </div>
      </div>
      
      {validation?.message && (
        <Alert variant={isValid ? "default" : "destructive"} className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isValid ? "Información" : "Advertencia"}</AlertTitle>
          <AlertDescription>{validation.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border p-4">
          <div className="text-sm font-medium text-muted-foreground">Examen</div>
          <div className="mt-1 font-semibold">
            {isLoadingNames ? (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                <span className="text-muted-foreground">Cargando...</span>
              </div>
            ) : (
              <>
                {entityNames.examName || 'Examen no encontrado'}
                <div className="text-xs text-muted-foreground mt-1 font-normal">{decodedData.examId}</div>
              </>
            )}
            {!matchesExam && (
              <div className="mt-1 text-xs text-red-600">
                No coincide con el examen actual ({examId})
              </div>
            )}
          </div>
        </div>
        
        <div className="rounded-md border p-4">
          <div className="text-sm font-medium text-muted-foreground">Estudiante</div>
          <div className="mt-1 font-semibold">
            {isLoadingNames ? (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                <span className="text-muted-foreground">Cargando...</span>
              </div>
            ) : (
              <>
                {entityNames.studentName || 'Estudiante no encontrado'}
                <div className="text-xs text-muted-foreground mt-1 font-normal">{decodedData.studentId}</div>
              </>
            )}
          </div>
        </div>
        
        {decodedData.groupId && (
          <div className="rounded-md border p-4">
            <div className="text-sm font-medium text-muted-foreground">Grupo</div>
            <div className="mt-1 font-semibold">
              {isLoadingNames ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  <span className="text-muted-foreground">Cargando...</span>
                </div>
              ) : (
                <>
                  {entityNames.groupName || 'Grupo no encontrado'}
                  <div className="text-xs text-muted-foreground mt-1 font-normal">{decodedData.groupId}</div>
                </>
              )}
            </div>
          </div>
        )}
        
        {(decodedData.hash || decodedData.checksum) && (
          <div className="rounded-md border p-4">
            <div className="text-sm font-medium text-muted-foreground">Hash de Verificación</div>
            <div className="mt-1 font-mono text-sm">
              {decodedData.hash || decodedData.checksum}
              {!isValid && (
                <div className="mt-1 text-xs text-red-600">
                  El hash de verificación no coincide con los datos. La hoja podría estar manipulada.
                </div>
              )}
            </div>
          </div>
        )}
        
        {decodedData.isManual && (
          <div className="col-span-2 rounded-md border p-4 bg-blue-50">
            <div className="text-sm font-medium text-blue-800">Información manual</div>
            <div className="mt-1 text-blue-700 text-sm">
              Estos datos fueron proporcionados manualmente, no se detectó un código QR en la imagen.
            </div>
          </div>
        )}
      </div>
      
      <div className="rounded-md border p-4">
        <div className="text-sm font-medium">Datos Originales</div>
        <div className="mt-1 break-all text-xs font-mono bg-muted p-2 rounded-md">
          {rawData}
        </div>
      </div>
    </div>
  );
};

interface ExamDetails {
  id: string;
  title: string;
  subject: {
    id: string;
    name: string;
  };
  numQuestions: number;
  // ... más propiedades según se necesiten
}

export default function ExamScanPage() {
  const params = useParams();
  const examId = typeof params.id === 'string' ? params.id : 
                 Array.isArray(params.id) ? params.id[0] : '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>({ success: false });
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  
  useEffect(() => {
    // Obtener detalles del examen
    const fetchExamDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      if (DEBUG) {
        logger.log(`Intentando cargar detalles para el examen ID: ${examId}`);
      }
      
      try {
        // Intentar obtener datos de la API principal
        const mainApiUrl = `/api/exams/${examId}/details`;
        if (DEBUG) {
          logger.log(`Cargando desde endpoint principal: ${mainApiUrl}`);
        }
        
        const response = await fetch(mainApiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          logger.error(`Error al cargar datos del examen. Status: ${response.status}`, errorData);
          
          throw new Error(
            `No se pudieron cargar los detalles del examen (${response.status}): ${
              errorData?.message || response.statusText
            }`
          );
        }
        
        const data = await response.json();
        if (DEBUG) {
          logger.log('Datos del examen recibidos correctamente:', data);
        }
        
        if (!data) {
          throw new Error('No se recibieron datos del examen');
        }
        
        setExamDetails(data);
      } catch (err) {
        logger.error('Error en fetchExamDetails:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos del examen');
        
        // Intentar usar datos de fallback para poder continuar
        if (DEBUG) {
          logger.log('Usando datos de fallback para el examen...');
        }
        setExamDetails({
          id: typeof params.id === 'string' ? params.id : 
             Array.isArray(params.id) ? params.id[0] : '',
          title: 'Examen (Modo Fallback)',
          subject: {
            id: 'fallback-subject',
            name: 'Materia no disponible',
          },
          numQuestions: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (examId) {
      fetchExamDetails();
    } else {
      setError('ID de examen no válido');
      setIsLoading(false);
    }
  }, [examId, params.id]);
  
  // Manejar cuando se completa un escaneo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScanComplete = (result: any, imageUrl: string) => {
    if (DEBUG) {
      logger.log('Scan completed with result:', result);
    }
    // Asegurarnos de que el resultado tenga las propiedades correctas
    const processedResult: ScanResult = {
      success: result.success,
      message: result.message,
      errorCode: result.errorCode,
      total_questions: result.total_questions,
      answered_questions: result.answered_questions
    };
    
    // Mapear las respuestas si existen
    if (result.success && result.answers) {
      processedResult.answers = result.answers;
    }
    
    // Mapear los datos del QR - añadir logs para debugging
    if (result.qr_data) {
      processedResult.qr_data = result.qr_data;
      processedResult.qrData = result.qr_data; // Duplicamos para asegurar compatibilidad
      if (DEBUG) {
        logger.log('Asignado desde result.qr_data:', processedResult.qr_data);
      }
    } else if (result.qrData) {
      processedResult.qrData = result.qrData;
      processedResult.qr_data = result.qrData; // Duplicamos para asegurar compatibilidad
      if (DEBUG) {
        logger.log('Asignado desde result.qrData:', processedResult.qrData);
      }
    }
    
    // Mapear la validación del QR
    if (result.qr_validation) {
      processedResult.qr_validation = result.qr_validation;
      if (DEBUG) {
        logger.log('QR validation:', processedResult.qr_validation);
      }
    }
    
    // Mapear los detalles de error si existen
    if (result.error_details) {
      processedResult.error_details = result.error_details;
    }
    
    // Almacenar el error si existe
    if (result.error) {
      processedResult.error = result.error;
    }
    
    // Usar la URL pública proporcionada por el backend si está disponible
    if (result.publicUrl) {
      processedResult.publicUrl = result.publicUrl;
      // También usar esta URL para la vista previa de la imagen
      imageUrl = result.publicUrl;
    }
    
    if (DEBUG) {
      logger.log('Resultado procesado final:', JSON.stringify(processedResult).substring(0, 300) + '...');
    }
    
    setScanResult(processedResult);
    setScanImageUrl(imageUrl);
  };
  
  // Reiniciar el escaneo
  const handleReset = () => {
    setScanResult({ success: false });
    setScanImageUrl(null);
  };
  
  // Manejar error de conexión
  const handleConnectionError = () => {
    setDiagnosticMode(true);
  };
  
  // Reintentar cargar detalles
  const handleRetry = () => {
    if (examId) {
      setDiagnosticMode(false);
      // Volvemos a cargar los detalles del examen
      setIsLoading(true);
      setError(null);
      
      const fetchExamDetailsAgain = async () => {
        try {
          // Intentar obtener datos de la API principal
          const mainApiUrl = `/api/exams/${examId}/details`;
          if (DEBUG) {
            logger.log(`Cargando desde endpoint principal: ${mainApiUrl}`);
          }
          
          const response = await fetch(mainApiUrl);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            logger.error(`Error al cargar datos del examen. Status: ${response.status}`, errorData);
            
            throw new Error(
              `No se pudieron cargar los detalles del examen (${response.status}): ${
                errorData?.message || response.statusText
              }`
            );
          }
          
          const data = await response.json();
          if (DEBUG) {
            logger.log('Datos del examen recibidos correctamente:', data);
          }
          
          if (!data) {
            throw new Error('No se recibieron datos del examen');
          }
          
          setExamDetails(data);
        } catch (err) {
          logger.error('Error en fetchExamDetails:', err);
          setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos del examen');
          
          // Intentar usar datos de fallback para poder continuar
          if (DEBUG) {
            logger.log('Usando datos de fallback para el examen...');
          }
          setExamDetails({
            id: typeof params.id === 'string' ? params.id : 
               Array.isArray(params.id) ? params.id[0] : '',
            title: 'Examen (Modo Fallback)',
            subject: {
              id: 'fallback-subject',
              name: 'Materia no disponible',
            },
            numQuestions: 0,
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchExamDetailsAgain();
    }
  };
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Escaneo de Examen</h1>
          <p className="text-muted-foreground">Cargando detalles...</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 bg-muted/50 rounded animate-pulse"></div>
              <div className="h-10 w-1/2 bg-muted/50 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="h-10 w-28 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 w-28 bg-muted/50 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <div className="text-center">
                  <p className="font-medium">Cargando detalles del examen</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esto puede tomar unos segundos...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (error && !examDetails) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error al cargar el examen</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-4 items-center justify-center">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Reintentar
          </Button>
          
          <Button onClick={handleConnectionError} variant="outline" className="gap-2">
            <Wrench className="h-4 w-4" /> Ejecutar diagnóstico
          </Button>
          
          <Button asChild variant="secondary" className="gap-2">
            <Link href="/dashboard/exams">
              <FileSearch className="h-4 w-4" /> Ver todos los exámenes
          </Link>
        </Button>
        </div>
        
        {diagnosticMode && (
          <div className="mt-8 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Diagnóstico de conexión</h3>
            <ConnectionDiagnostic examId={typeof params.id === 'string' ? params.id : 
                                     Array.isArray(params.id) ? params.id[0] : ''} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Escaneo de Examen</h1>
        <p className="text-muted-foreground">
          {examDetails?.title} - {examDetails?.subject?.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Captura y Procesamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamScanner 
                examId={examId} 
                onScanComplete={handleScanComplete}
                onConnectionError={handleConnectionError}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resultados del Escaneo</CardTitle>
            </CardHeader>
            <CardContent>
              {!scanResult.success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <AlertCircle className="mb-2 h-8 w-8" />
                  <h3 className="text-lg font-medium">Sin resultados</h3>
                  <p className="mt-1">
                    Escanea una hoja de respuestas para ver los resultados del procesamiento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Estado del procesamiento</h3>
                    {scanResult.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="mr-1 h-5 w-5" />
                        <span>Exitoso</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="mr-1 h-5 w-5" />
                        <span>Error</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <Tabs defaultValue="answers">
                    <TabsList className={`w-full grid ${!scanResult.success && scanResult.error_details ? 'grid-cols-5' : 'grid-cols-4'}`}>
                      <TabsTrigger value="answers" className="text-xs sm:text-sm">Respuestas</TabsTrigger>
                      <TabsTrigger value="summary" className="text-xs sm:text-sm">Resumen</TabsTrigger>
                      <TabsTrigger value="image" className="text-xs sm:text-sm">Imagen</TabsTrigger>
                      <TabsTrigger value="qrdata" className="text-xs sm:text-sm">Código QR</TabsTrigger>
                      {!scanResult.success && scanResult.error_details && (
                        <TabsTrigger value="diagnostic" className="text-xs sm:text-sm">Diagnóstico</TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="answers" className="space-y-4">
                      {scanResult.answers && scanResult.answers.length > 0 ? (
                        <div className="mt-2 grid grid-cols-2 gap-6">
                          {/* Columna izquierda: Preguntas 1-10 */}
                          <div className="space-y-2">
                            {/* Mostrar todas las preguntas del 1-10, con o sin respuesta */}
                            {[...Array(10)].map((_, idx) => {
                              const questionNum = idx + 1;
                              const answer = scanResult.answers?.find(a => a.number === questionNum);
                              
                              if (answer) {
                                // Pregunta con respuesta
                                return (
                                  <div 
                                    key={`question-${questionNum}`} 
                                    className="flex items-center justify-between rounded-md border p-2"
                                  >
                                    <div className="flex items-center">
                                      <div className="bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium">{questionNum}</span>
                                      </div>
                                      <div className="text-lg font-bold">{answer.value}</div>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded-full bg-muted">
                                      {Math.round(answer.confidence * 100)}% conf.
                                    </div>
                                  </div>
                                );
                              } else {
                                // Pregunta sin respuesta
                                return (
                                  <div 
                                    key={`question-${questionNum}`} 
                                    className="flex items-center justify-between rounded-md border border-dashed p-2 opacity-70"
                                  >
                                    <div className="flex items-center">
                                      <div className="bg-muted rounded-full w-7 h-7 flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium">{questionNum}</span>
                                      </div>
                                      <div className="text-lg font-medium text-muted-foreground">-</div>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded-full bg-muted/50">
                                      Sin respuesta
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                          
                          {/* Columna derecha: Preguntas 11-20 */}
                          <div className="space-y-2">
                            {/* Mostrar todas las preguntas del 11-20, con o sin respuesta */}
                            {[...Array(10)].map((_, idx) => {
                              const questionNum = idx + 11;
                              const answer = scanResult.answers?.find(a => a.number === questionNum);
                              
                              if (answer) {
                                // Pregunta con respuesta
                                return (
                                  <div 
                                    key={`question-${questionNum}`} 
                                    className="flex items-center justify-between rounded-md border p-2"
                                  >
                                    <div className="flex items-center">
                                      <div className="bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium">{questionNum}</span>
                                      </div>
                                      <div className="text-lg font-bold">{answer.value}</div>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded-full bg-muted">
                                      {Math.round(answer.confidence * 100)}% conf.
                                    </div>
                                  </div>
                                );
                              } else {
                                // Pregunta sin respuesta
                                return (
                                  <div 
                                    key={`question-${questionNum}`} 
                                    className="flex items-center justify-between rounded-md border border-dashed p-2 opacity-70"
                                  >
                                    <div className="flex items-center">
                                      <div className="bg-muted rounded-full w-7 h-7 flex items-center justify-center mr-3">
                                        <span className="text-sm font-medium">{questionNum}</span>
                                      </div>
                                      <div className="text-lg font-medium text-muted-foreground">-</div>
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded-full bg-muted/50">
                                      Sin respuesta
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No hay respuestas disponibles</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {!scanResult.success ? 
                              "No se pudieron detectar respuestas debido a un error en el procesamiento." :
                              "No se encontraron respuestas marcadas en la hoja de examen."}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md border p-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            Total Preguntas
                          </div>
                          <div className="mt-1 text-2xl font-bold">
                            {scanResult.total_questions || 0}
                          </div>
                        </div>
                        <div className="rounded-md border p-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            Respondidas
                          </div>
                          <div className="mt-1 text-2xl font-bold">
                            {scanResult.answered_questions || 0}
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-md border p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          Completitud
                        </div>
                        <div className="mt-1 text-2xl font-bold">
                          {Math.round(((scanResult.answered_questions || 0) / (scanResult.total_questions || 1)) * 100)}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: `${Math.round(((scanResult.answered_questions || 0) / (scanResult.total_questions || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Añadir información de errores si existen */}
                      {!scanResult.success && scanResult.error_details && (
                        <div className="rounded-md border border-red-200 p-4 bg-red-50">
                          <div className="text-sm font-medium text-red-800 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Error en el procesamiento
                          </div>
                          <div className="mt-2 text-sm text-red-700">
                            {scanResult.error_details.message}
                          </div>
                          
                          {scanResult.error_details.recommendations && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-red-800">Recomendaciones:</div>
                              <ul className="mt-1 pl-5 list-disc text-xs text-red-700 space-y-1">
                                {scanResult.error_details.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="p-2 bg-white/50 rounded text-xs border border-red-100">
                              <span className="text-red-700 font-semibold">Tipo:</span>
                              <span className="ml-1 text-red-800">{scanResult.error_details.type}</span>
                            </div>
                            <div className="p-2 bg-white/50 rounded text-xs border border-red-100">
                              <span className="text-red-700 font-semibold">Código:</span>
                              <span className="ml-1 text-red-800">{scanResult.error_details.code}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="image">
                      {scanImageUrl && (
                        <div className="mt-2 overflow-hidden rounded-md border">
                          <img 
                            src={scanResult.processedImageUrl || scanImageUrl.replace(/\.(jpg|jpeg|png)$/, 'questions_detected.jpeg')} 
                            alt="Escaneo con respuestas detectadas" 
                            className="w-full object-contain"
                            onError={(e) => {
                              logger.error('Error cargando imagen procesada:', (e.target as HTMLImageElement).src);
                            }}
                          />
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            Imagen procesada por el sistema OMR con overlay de respuestas detectadas
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="qrdata">
                      {(scanResult.qrData || scanResult.qr_data) ? (
                        <div className="space-y-4">
                          {/* Bloque de debugging para ver exactamente qué datos se reciben */}
                          <div className="p-2 bg-muted rounded-md text-xs">
                            <p className="font-semibold mb-1">Datos recibidos del QR:</p>
                            <pre className="whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(scanResult.qrData || scanResult.qr_data, null, 2)}
                            </pre>
                          </div>
                          
                          <ScanQRInfo 
                            qrData={scanResult.qrData || scanResult.qr_data} 
                            qrValidation={scanResult.qr_validation}
                            examId={examId} 
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No se detectó código QR</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            No se pudo encontrar un código QR válido en la imagen escaneada.
                            Intente escanear nuevamente con mejor iluminación y asegúrese de que el código QR es visible.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Contenido de la pestaña de diagnóstico */}
                    {!scanResult.success && scanResult.error_details && (
                      <TabsContent value="diagnostic" className="space-y-4">
                        <div className="bg-white border rounded-md p-4">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                            Diagnóstico del error
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="p-3 border rounded-md bg-muted/20">
                              <h4 className="text-sm font-medium mb-2">Información del error</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 border rounded-md bg-white">
                                  <div className="text-xs text-muted-foreground">Tipo de error</div>
                                  <div className="font-medium">{scanResult.error_details.type}</div>
                                </div>
                                <div className="p-2 border rounded-md bg-white">
                                  <div className="text-xs text-muted-foreground">Código de error</div>
                                  <div className="font-medium">{scanResult.error_details.code}</div>
                                </div>
                              </div>
                              <div className="mt-3 p-2 border rounded-md bg-white">
                                <div className="text-xs text-muted-foreground">Mensaje</div>
                                <div className="text-sm">{scanResult.error_details.message}</div>
                              </div>
                              {scanResult.error && (
                                <div className="mt-3 p-2 border rounded-md bg-white">
                                  <div className="text-xs text-muted-foreground">Mensaje técnico</div>
                                  <div className="text-xs font-mono">{scanResult.error}</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-3 border rounded-md bg-amber-50">
                              <h4 className="text-sm font-medium mb-2 text-amber-800">Recomendaciones para resolver</h4>
                              <ul className="space-y-2">
                                {scanResult.error_details.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <Check className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                                    <span className="text-sm text-amber-700">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="p-3 border rounded-md bg-blue-50">
                              <h4 className="text-sm font-medium mb-2 text-blue-800">Pasos sugeridos</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li className="text-sm text-blue-700">Intenta con una nueva captura siguiendo las recomendaciones</li>
                                <li className="text-sm text-blue-700">Verifica la iluminación y el ángulo de la cámara</li>
                                <li className="text-sm text-blue-700">Asegúrate de que la hoja de respuestas no esté dañada</li>
                                <li className="text-sm text-blue-700">Si el problema persiste, usa la opción de carga manual de respuestas</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="w-full"
                    >
                      Realizar otro escaneo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 