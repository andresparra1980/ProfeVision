"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImagePlus, Upload, AlertTriangle, Camera, Loader2, Check, X, RefreshCw, AlertCircle, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import logger from '@/lib/utils/logger';

// Configurar flag de debug para mensajes de consola
const _DEBUG = process.env.NODE_ENV === 'development';

// Define el tipo para los resultados del OMR
interface OMRAnswer {
  number: number;
  value: string;
  confidence: number;
  num_options: number;
}

// Define the structure for QR data
interface QRData {
  examId: string;
  studentId: string;
  groupId?: string;
  isValid: boolean;
  [key: string]: unknown;
}

interface OMRResult {
  success: boolean;
  answers: OMRAnswer[];
  qr_data: QRData | string;
  original_image?: string;
  processed_image?: string;
  publicUrl?: string;
  total_questions?: number;
  answered_questions?: number;
  confidence?: number;  // Añadido para compatibilidad
  message?: string;     // Añadido para mensajes de error
  error_code?: string;  // Añadido para códigos de error
  error?: string;       // Mensaje de error detallado
  error_details?: {
    type: string;
    code: string;
    message: string;
    recommendations: string[];
  };
}

// Expandir las propiedades del componente para incluir callbacks adicionales
export interface ExamScannerProps {
  examId?: string;
  onScanComplete?: (_result: OMRResult, _imageUrl: string) => void;
  _onConnectionError?: () => void;
}

export function ExamScanner({
  examId,
  onScanComplete,
  _onConnectionError
}: ExamScannerProps) {
  const [_isProcessing, setIsProcessing] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'available' | 'not-supported' | 'permission-denied'>('checking');
  const [scanning, _setScanning] = useState<boolean>(false);
  const [_uploading, _setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [omrResult, setOmrResult] = useState<OMRResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fileUploadMode, setFileUploadMode] = useState<boolean>(true);
  const [_errorMessage, setErrorMessage] = useState<string | null>(null);
  const [_progress, setProgress] = useState({ status: 'idle', percent: 0 });
  const [_connectionError, setConnectionError] = useState(false);
  const [_testingConnection, setTestingConnection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCameraSupport, setHasCameraSupport] = useState(false);

  // Función para manejar errores de conexión específicamente
  const handleConnectionError = useCallback((error: Error) => {
    logger.error('Error de conexión detectado:', error);
    setConnectionError(true);
    setErrorMessage('Problema de conexión detectado. Verifique su conexión a Internet.');
    toast.error('Problema de conexión. Verifique su conexión a Internet.');
  }, []);
  
  // Función para iniciar la cámara
  const startCamera = useCallback(async () => {
    if (!hasCameraSupport) {
      toast.error('Este dispositivo no soporta acceso a la cámara');
      return;
    }
    
    try {
      // Si ya hay una transmisión activa, la detenemos primero
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Obtener una nueva transmisión de la cámara
      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      // Función interna para probar la conexión con el servidor
      const testConnection = async (): Promise<boolean> => {
        setTestingConnection(true);
        setConnectionError(false);
        
        try {
          const response = await fetch('/api/health', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Error de conexión: ${response.status}`);
          }
          
          await response.json();
          return true;
        } catch (_error) {
          handleConnectionError(new Error('No se pudo conectar con el servidor'));
          return false;
        } finally {
          setTestingConnection(false);
        }
      };
      
      // Comprobar conectividad primero
      const hasConnection = await testConnection();
      if (!hasConnection) {
        setConnectionError(true);
        toast.error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
        return;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraStatus('available');
      
    } catch (_error) {
      logger.error('Error al iniciar la cámara:', _error);
      setCameraStatus('not-supported');
      toast.error('No se pudo iniciar la cámara. Verifica los permisos del navegador.');
    }
  }, [hasCameraSupport, isMobile, stream, handleConnectionError]);

  // Iniciar la cámara cuando el componente se monta, si estamos en modo cámara
  useEffect(() => {
    if (!fileUploadMode) {
      startCamera();
    }
    
    // Limpieza al desmontar
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [fileUploadMode, stream, startCamera]);
  
  // Función para manejar la carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast('Tipo de archivo no válido', {
        description: 'Por favor, selecciona una imagen (JPG, PNG, etc.)'
      });
      return;
    }
    
    // Verificar tamaño máximo (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast('Archivo demasiado grande', {
        description: 'La imagen debe ser menor a 10MB'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setCapturedImage(e.target.result);
        setProcessingStatus('idle');
      }
    };
    reader.onerror = () => {
      toast('Error al leer el archivo', {
        description: 'No se pudo procesar la imagen seleccionada'
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Función para cambiar entre modo cámara y carga de archivos
  const toggleMode = () => {
    setFileUploadMode(!fileUploadMode);
    setCapturedImage(null);
    setProcessingStatus('idle');
    setUploadError(null);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  // Trigger para abrir el selector de archivos
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Función para capturar imagen desde la cámara
  const captureImage = async () => {
    if (!videoRef.current || !stream) {
      toast.error('No hay una transmisión de cámara activa');
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      // Configuramos el tamaño del canvas para que coincida con el video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujamos el frame actual del video en el canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener contexto 2D del canvas');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertimos el canvas a un blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo convertir la imagen a blob'));
          }
        }, 'image/jpeg', 0.95);
      });
      
      // Creamos un File a partir del Blob
      const file = new File([blob], `exam-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Actualizamos el estado con la imagen capturada
      setCapturedImage(URL.createObjectURL(file));
      setProcessingStatus('idle');
      
    } catch (_error) {
      toast.error('Error al capturar la imagen');
    }
  };
  
  // Función para subir la imagen capturada
  const uploadImage = async (file: File): Promise<void> => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress({ status: 'uploading', percent: 0 });
      
      // Preparar FormData para subir la imagen
      const formData = new FormData();
      formData.append('file', file);
      if (examId) formData.append('examId', examId);
      
      // Realizar la carga con seguimiento de progreso
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress({ status: 'uploading', percent: percentComplete });
        }
      });
      
      xhr.onload = async function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Carga exitosa, procesar respuesta
          try {
            const responseData = JSON.parse(xhr.responseText);
            logger.log('Respuesta del servidor:', responseData);
            
            if (responseData.success) {
              setProgress({ status: 'processing', percent: 100 });
              
              if (responseData.processInBackground) {
                // El servidor procesará la imagen en segundo plano
                const taskId = responseData.taskId;
                await processInBackground(taskId);
              } else {
                // Procesamiento inmediato, mostrar resultados
                const omrResult: OMRResult = {
                  success: true,
                  answers: responseData.answers || [],
                  confidence: responseData.confidence || 0,
                  qr_data: responseData.qr_data || responseData.qrData || null,
                  original_image: responseData.originalImage || null,
                  processed_image: responseData.processedImage || null,
                  publicUrl: responseData.publicUrl || null
                };
                
                setOmrResult(omrResult);
                
                // Usar la URL pública si está disponible, o la imagen procesada/original como fallback
                const imageToDisplay = responseData.publicUrl || responseData.processedImage || responseData.originalImage || null;
                setCapturedImage(imageToDisplay || '');
                
                if (onScanComplete) {
                  onScanComplete(omrResult, imageToDisplay || '');
                }
              }
            } else {
              // Error en el procesamiento
              setErrorMessage(responseData.message || 'Error al procesar la imagen');
              const omrResult: OMRResult = {
                success: false,
                message: responseData.message || 'Error al procesar la imagen',
                error_code: responseData.errorCode || 'unknown_error',
                error_details: responseData.error_details || null,
                error: responseData.error || null,
                publicUrl: responseData.publicUrl || null,
                answers: [], // Inicializar answers como array vacío
                qr_data: responseData.qr_data || null, // Añadir qr_data para cumplir con la interfaz
              };
              setOmrResult(omrResult);
              
              // Usar URL pública si está disponible, incluso en caso de error
              const imageToDisplay = responseData.publicUrl || responseData.originalImage || '';
              
              if (onScanComplete) {
                onScanComplete(omrResult, imageToDisplay);
              }
            }
          } catch (parseError) {
            logger.error('Error al procesar respuesta del servidor:', parseError);
            setErrorMessage('Error al procesar la respuesta del servidor');
            
            // Verificar si es un error de conexión o de formato
            if (xhr.responseText.includes('<!DOCTYPE html>') || xhr.responseText.trim() === '') {
              handleConnectionError(new Error('Respuesta del servidor en formato incorrecto'));
            }
          }
        } else {
          // Error HTTP
          logger.error(`Error HTTP: ${xhr.status} ${xhr.statusText}`);
          
          let errorMessage = `Error del servidor: ${xhr.status} ${xhr.statusText}`;
          let parsedError = null;
          
          try {
            parsedError = JSON.parse(xhr.responseText);
            errorMessage = parsedError.message || errorMessage;
          } catch (_e) {
            // No es JSON, usar el mensaje genérico
          }
          
          setErrorMessage(errorMessage);
          
          // Si el error es 5xx, probablemente sea un problema de conexión o del servidor
          if (xhr.status >= 500) {
            handleConnectionError(new Error(`Error del servidor: ${xhr.status}`));
          }
          
          const omrResult: OMRResult = {
            success: false,
            message: errorMessage,
            error_code: `http_${xhr.status}`,
            error_details: parsedError ? {
              type: 'http_error',
              code: `http_${xhr.status}`,
              message: parsedError.message || errorMessage,
              recommendations: ['Intente nuevamente más tarde']
            } : undefined,
            error: undefined,
            publicUrl: undefined,
            answers: [], // Inicializar answers como array vacío
            qr_data: { examId: "", studentId: "", isValid: false }
          };
          
          setOmrResult(omrResult);
          
          if (onScanComplete) {
            onScanComplete(omrResult, '');
          }
        }
      };
      
      xhr.onerror = function() {
        logger.error('Error de red al subir la imagen');
        setErrorMessage('Error de conexión al subir la imagen');
        
        // Claro error de conexión
        handleConnectionError(new Error('Error de red al subir la imagen'));
        
        const omrResult: OMRResult = {
          success: false,
          message: 'Error de conexión al subir la imagen',
          error_code: 'network_error',
          error_details: {
            type: 'connection_error',
            code: 'network_error',
            message: 'Error de conexión al intentar subir la imagen',
            recommendations: ['Verifique su conexión a internet', 'Intente nuevamente más tarde']
          },
          error: undefined,
          publicUrl: undefined,
          answers: [], // Inicializar answers como array vacío
          qr_data: { examId: "", studentId: "", isValid: false }
        };
        
        setOmrResult(omrResult);
        
        if (onScanComplete) {
          onScanComplete(omrResult, '');
        }
      };
      
      xhr.timeout = 60000; // 60 segundos de timeout
      xhr.ontimeout = function() {
        logger.error('Timeout al subir la imagen');
        setErrorMessage('La solicitud ha excedido el tiempo límite');
        
        // También es un tipo de error de conexión
        handleConnectionError(new Error('Timeout al subir la imagen'));
        
        const omrResult: OMRResult = {
          success: false,
          message: 'La solicitud ha excedido el tiempo límite',
          error_code: 'timeout',
          error_details: {
            type: 'timeout_error',
            code: 'timeout',
            message: 'La solicitud ha excedido el tiempo límite',
            recommendations: ['Intente con una imagen de menor tamaño', 'Verifique su conexión a internet']
          },
          error: undefined,
          publicUrl: undefined,
          answers: [], // Inicializar answers como array vacío
          qr_data: { examId: "", studentId: "", isValid: false }
        };
        
        setOmrResult(omrResult);
        
        if (onScanComplete) {
          onScanComplete(omrResult, '');
        }
      };
      
      xhr.open('POST', '/api/exams/process-scan', true);
      xhr.send(formData);
    } catch (error) {
      logger.error('Error al subir la imagen:', error);
      setErrorMessage('Error al iniciar la carga de la imagen');
      
      // Error general, podría ser de conexión o local
      if (error instanceof Error && 
          (error.message.includes('network') || error.message.includes('connection'))) {
        handleConnectionError(error);
      }
      
      const omrResult: OMRResult = {
        success: false,
        message: 'Error al iniciar la carga de la imagen',
        error_code: 'general_error',
        error_details: {
          type: 'general_error',
          code: 'general_error',
          message: error instanceof Error ? error.message : 'Error desconocido al intentar subir la imagen',
          recommendations: ['Verifique su conexión a internet', 'Intente nuevamente más tarde']
        },
        error: undefined,
        publicUrl: undefined,
        answers: [], // Inicializar answers como array vacío
        qr_data: { examId: "", studentId: "", isValid: false }
      };
      
      setOmrResult(omrResult);
      
      if (onScanComplete) {
        onScanComplete(omrResult, '');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Función para procesar en segundo plano
  const processInBackground = async (taskId: string): Promise<void> => {
    try {
      setProgress({ status: 'processing', percent: 0 });
      
      // Inicio del polling
      let completed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 intentos, 1 cada 2 segundos = 1 minuto máximo
      
      while (!completed && attempts < maxAttempts) {
        attempts++;
        
        // Actualizar progreso proporcional a los intentos
        const progressPercent = Math.min(90, Math.round((attempts / maxAttempts) * 100));
        setProgress({ status: 'processing', percent: progressPercent });
        
        try {
          const response = await fetch(`/api/exams/scan-status?taskId=${taskId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // Error HTTP
            const statusText = await response.text();
            logger.error(`Error al verificar estado (${response.status}): ${statusText}`);
            throw new Error(`Error al verificar estado (${response.status}): ${statusText}`);
          }
          
          const statusData = await response.json();
          
          if (statusData.status === 'completed') {
            completed = true;
            setProgress({ status: 'processing', percent: 100 });
            
            if (statusData.result.success) {
              const omrResult: OMRResult = {
                success: true,
                answers: statusData.result.answers || [],
                confidence: statusData.result.confidence || 0,
                qr_data: statusData.result.qrData || { examId: "", studentId: "", isValid: false },
                original_image: statusData.result.originalImage || null,
                processed_image: statusData.result.processedImage || null,
                publicUrl: statusData.result.publicUrl || null
              };
              
              setOmrResult(omrResult);
              
              // Usar la URL pública si está disponible, o la imagen procesada/original como fallback
              const imageToDisplay = statusData.result.publicUrl || statusData.result.processedImage || statusData.result.originalImage || null;
              setCapturedImage(imageToDisplay);
              
              if (onScanComplete) {
                onScanComplete(omrResult, imageToDisplay || '');
              }
            } else {
              // Procesamiento completado pero con error
              setErrorMessage(statusData.result.message || 'Error al procesar la imagen');
              
              const omrResult: OMRResult = {
                success: false,
                message: statusData.result.message || 'Error al procesar la imagen',
                error_code: statusData.result.errorCode || 'processing_error',
                error_details: statusData.result.errorDetails || null,
                error: statusData.result.error || null,
                publicUrl: statusData.result.publicUrl || null,
                answers: [], // Inicializar answers como array vacío
                qr_data: statusData.result.qrData || { examId: "", studentId: "", isValid: false },
              };
              
              setOmrResult(omrResult);
              
              if (onScanComplete) {
                onScanComplete(omrResult, statusData.result.originalImage || '');
              }
            }
          } else if (statusData.status === 'failed') {
            completed = true;
            throw new Error(statusData.error || 'El procesamiento ha fallado');
          } else {
            // Aún procesando, esperar 2 segundos antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (pollError) {
          logger.error('Error en el polling:', pollError);
          
          // Si después de varios intentos seguimos teniendo errores, podría ser un problema de conexión
          if (attempts > maxAttempts / 2) {
            handleConnectionError(new Error('Errores continuos al verificar el estado del procesamiento'));
          }
          
          // Reintentar en el siguiente ciclo, a menos que sea el último intento
          if (attempts >= maxAttempts) {
            throw pollError;
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Si llegamos aquí sin completar, es un timeout
      if (!completed) {
        throw new Error('Se agotó el tiempo de espera para el procesamiento');
      }
      
    } catch (error) {
      logger.error('Error en processInBackground:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido en el procesamiento');
      
      // Determinar si es un error de conexión
      if (error instanceof Error && 
          (error.message.includes('conexión') || 
           error.message.includes('network') || 
           error.message.includes('servidor'))) {
        handleConnectionError(error);
      }
      
      const omrResult: OMRResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido en el procesamiento',
        error_code: 'background_processing_error',
        error_details: {
          type: 'processing_error',
          code: 'background_processing_error',
          message: error instanceof Error ? error.message : 'Error desconocido en el procesamiento',
          recommendations: ['Intente con una imagen más clara', 'Verifique que la hoja esté completa en la imagen']
        },
        error: undefined,
        publicUrl: undefined,
        answers: [], // Inicializar answers como array vacío
        qr_data: { examId: "", studentId: "", isValid: false }
      };
      
      setOmrResult(omrResult);
      
      if (onScanComplete) {
        onScanComplete(omrResult, '');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para renderizar los resultados del OMR
  const renderOMRResults = () => {
    if (!omrResult) return null;
    
    return (
      <div className="space-y-4">
        {omrResult.success && omrResult.answers && omrResult.answers.length > 0 ? (
          <>
            <h3 className="font-medium text-lg flex items-center gap-2">
              <CheckCircle2 className="text-green-500 h-5 w-5" />
              Resultados detectados
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {omrResult.answers.map((answer, index) => (
                <div key={index} className="bg-muted rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Pregunta {answer.number}</div>
                  <div className="font-bold">{answer.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(answer.confidence * 100)}% confianza
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <h3 className="font-medium text-lg">No se detectaron respuestas</h3>
            <p className="text-muted-foreground mt-1">
              {omrResult.success 
                ? 'No se pudieron detectar las marcas en la hoja. Intenta mejorar las condiciones de iluminación y asegúrate de que las marcas sean claras.'
                : 'No se pudieron procesar las respuestas debido a un error. Verifica la calidad de la imagen y asegúrate de que toda la hoja sea visible.'}
            </p>
          </div>
        )}
        
        {/* Mostrar información del QR si existe */}
        {omrResult.qr_data && (
          <div className="mt-4 border rounded-md p-3">
            <h3 className="font-medium text-lg flex items-center gap-2 mb-2">
              <QrCode className="h-5 w-5" />
              Datos del código QR
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-md p-2">
                <span className="text-xs text-muted-foreground">ID Examen</span>
                <p className="font-medium">
                  {typeof omrResult.qr_data === 'string' 
                    ? 'No disponible' 
                    : omrResult.qr_data.examId || 'No disponible'}
                </p>
              </div>
              <div className="bg-muted rounded-md p-2">
                <span className="text-xs text-muted-foreground">ID Estudiante</span>
                <p className="font-medium">
                  {typeof omrResult.qr_data === 'string' 
                    ? 'No disponible' 
                    : omrResult.qr_data.studentId || 'No disponible'}
                </p>
              </div>
              {typeof omrResult.qr_data !== 'string' && omrResult.qr_data.groupId && (
                <div className="bg-muted rounded-md p-2">
                  <span className="text-xs text-muted-foreground">Grupo</span>
                  <p className="font-medium">
                    {omrResult.qr_data.groupId}
                  </p>
                </div>
              )}
              <div className="bg-muted rounded-md p-2">
                <span className="text-xs text-muted-foreground">Validación</span>
                <p className="font-medium flex items-center gap-1">
                  {typeof omrResult.qr_data === 'string' 
                    ? <><XCircle className="h-4 w-4 text-red-500" /> Inválido</>
                    : omrResult.qr_data.isValid 
                      ? <><Check className="h-4 w-4 text-green-500" /> Válido</>
                      : <><XCircle className="h-4 w-4 text-red-500" /> Inválido</>
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Efecto para procesar la respuesta del servidor
  useEffect(() => {
    if (processingStatus === 'completed' && omrResult) {
      if (onScanComplete) {
        onScanComplete(omrResult, capturedImage || '');
      }
    } else if (processingStatus === 'error' && _errorMessage) {
      toast.error(`Error al procesar: ${_errorMessage}`);
    }
  }, [processingStatus, omrResult, capturedImage, onScanComplete, _errorMessage]);

  // Procesar la imagen capturada (función no utilizada actualmente, pero mantenemos por compatibilidad)
  const _processImage = async (): Promise<void> => {
    if (!capturedImage) {
      toast.error('No hay imagen para procesar');
      return;
    }
    
    setProcessingStatus('processing');
    
    try {
      // Aquí implementar la lógica para procesar la imagen
      // Ejemplo: Enviar la imagen a un servicio para OMR
      
      const formData = new FormData();
      
      // Convertir dataURL a blob si es necesario
      if (capturedImage.startsWith('data:')) {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        formData.append('file', blob, 'scanned-image.jpg');
      } else {
        // La imagen ya es un archivo o URL
        formData.append('file', capturedImage);
      }
      
      // Enviar al servidor para procesamiento OMR
      const response = await fetch('/api/process-omr', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error al procesar: ${response.statusText}`);
      }
      
      const result = await response.json();
      setOmrResult(result);
      setProcessingStatus('completed');
      
    } catch (_error) {
      logger.error('Error al procesar la imagen:', _error);
      setProcessingStatus('error');
      setErrorMessage(_error instanceof Error ? _error.message : 'Error desconocido al procesar la imagen');
    }
  };

  // Detectar si se está ejecutando en un dispositivo móvil
  const checkMobile = () => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobile = Boolean(
      userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)
    );
    setIsMobile(mobile);
  };
  
  // Verificar soporte de cámara
  const checkCameraSupport = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraSupport(false);
        return;
      }
      setHasCameraSupport(true);
    } catch (_error) {
      setHasCameraSupport(false);
    }
  };
  
  checkMobile();
  checkCameraSupport();

  return (
    <div className="flex flex-col space-y-4">
      {/* Input de archivo oculto */}
      <input
        type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Instrucciones */}
      {!capturedImage && !_uploading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Instrucciones</AlertTitle>
          <AlertDescription>
            {fileUploadMode 
              ? "Selecciona una imagen clara de la hoja de respuestas. Asegúrate de que todas las marcas sean visibles."
              : "Coloca la hoja de respuestas en una superficie plana con buena iluminación. Asegúrate de que sea visible y esté centrada antes de capturar la imagen."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Mensaje de error sobre el uso de la cámara */}
      {registrationError && (
        <div className="mt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de registro</AlertTitle>
            <AlertDescription>
              {registrationError}
            </AlertDescription>
          </Alert>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setRegistrationError(null)} 
            className="mt-2"
          >
            Cerrar mensaje
          </Button>
        </div>
      )}

      {/* Botón para cambiar de modo */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={toggleMode}>
          {fileUploadMode 
            ? <><Camera className="mr-2 h-4 w-4" />Usar cámara</>
            : <><Upload className="mr-2 h-4 w-4" />Subir archivo</>}
        </Button>
      </div>
      
      {/* Error de subida */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {/* Visor de cámara o área de carga de archivo */}
      {!capturedImage ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
          {fileUploadMode ? (
            <div 
              className="flex h-full flex-col items-center justify-center p-4 cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors"
              onClick={openFileSelector}
            >
              <div className="bg-primary/10 rounded-full p-4 mb-3">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mt-2 text-lg font-semibold">Seleccionar imagen</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground max-w-xs">
                Haz clic para seleccionar una imagen de una hoja de respuestas desde tu dispositivo
              </p>
              <Button 
                variant="outline" 
                className="mt-4" 
                size="sm"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Examinar archivos
              </Button>
            </div>
          ) : (
            <>
              {cameraStatus === 'checking' && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Iniciando cámara...</span>
                </div>
              )}
              
              {cameraStatus === 'not-supported' && (
                <div className="flex h-full flex-col items-center justify-center p-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <h3 className="mt-2 text-lg font-semibold">Cámara no soportada</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Tu dispositivo no soporta acceso a la cámara o no se detectó ninguna cámara.
                    Por favor, usa la opción de subir archivo.
                  </p>
                </div>
              )}
              
              {cameraStatus === 'permission-denied' && (
                <div className="flex h-full flex-col items-center justify-center p-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <h3 className="mt-2 text-lg font-semibold">Permiso denegado</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Se denegó el permiso para acceder a la cámara. Por favor, permite el acceso a la cámara
                    en la configuración de tu navegador o usa la opción de subir archivo.
                  </p>
                </div>
              )}
              
              {cameraStatus === 'available' && (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              )}
              
              {cameraStatus === 'available' && scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
          {capturedImage && (
            <Image 
              src={capturedImage} 
              alt="Imagen capturada" 
              className="h-full w-full object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              unoptimized={capturedImage.startsWith('data:')}
            />
          )}
          
          {_uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="mt-2 text-white">Subiendo imagen...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Controles de cámara o carga */}
      {!capturedImage ? (
        <div className="flex justify-center space-x-2">
          {fileUploadMode ? (
            <Button
              onClick={openFileSelector}
              variant="default"
              className="px-6"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar archivo
            </Button>
          ) : (
            <>
              {cameraStatus === 'available' && (
                <Button
                  onClick={captureImage}
                  disabled={scanning}
                  variant="default"
                  className="px-6"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {scanning ? 'Capturando...' : 'Capturar'}
                </Button>
              )}
              
              {cameraStatus !== 'available' && cameraStatus !== 'checking' && (
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="px-6"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-center space-x-2">
          {!_uploading && processingStatus === 'idle' && (
            <>
              <Button
                onClick={() => {
                  setCapturedImage(null);
                  setOmrResult(null);
                  setProcessingStatus('idle');
                  setUploadError(null);
                  startCamera();
                }}
                variant="outline"
                className="px-6"
              >
                <X className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              
              <Button
                onClick={() => {
                  if (capturedImage) {
                    uploadImage(new File([capturedImage], 'image.png'));
                  }
                }}
                variant="default"
                className="px-6"
              >
                <Upload className="mr-2 h-4 w-4" />
                Procesar
              </Button>
            </>
          )}
        </div>
      )}
      
      {/* Mostrar resultados del OMR */}
      {processingStatus === 'completed' && renderOMRResults()}
      
      {/* Loading de procesamiento */}
      {processingStatus === 'processing' && (
        <div className="flex flex-col items-center justify-center rounded-lg border p-6 mt-4 bg-muted/30">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">Procesando respuestas</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Estamos analizando la imagen y detectando las respuestas marcadas...
          </p>
          <div className="w-full max-w-md mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              Este proceso puede tomar entre 5-15 segundos dependiendo del tamaño de la imagen
            </p>
          </div>
        </div>
      )}
      
      {/* Error de procesamiento */}
      {processingStatus === 'error' && !omrResult && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 p-6 mt-4 bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="text-lg font-semibold">Error de procesamiento</h3>
          <p className="mt-1 text-center text-sm">
            {uploadError || 'No se pudo procesar la imagen correctamente. Por favor, intenta con otra imagen.'}
          </p>
          
          <div className="mt-4 space-y-2 w-full max-w-md p-4 bg-white/80 rounded-md border">
            <h4 className="text-sm font-medium">Consejos para mejorar la detección:</h4>
            <ul className="text-xs space-y-1 list-disc pl-4">
              <li>Asegúrate de que las 4 esquinas de la hoja sean visibles</li>
              <li>Evita sombras y reflejos sobre la hoja</li>
              <li>Utiliza un fondo oscuro que contraste con la hoja blanca</li>
              <li>La hoja debe estar completamente plana, sin dobleces</li>
              <li>Las marcas deben estar hechas con lápiz oscuro y rellenadas completamente</li>
              <li>Verifica que el código QR esté claramente visible</li>
            </ul>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCapturedImage(null);
                setOmrResult(null);
                setProcessingStatus('idle');
                setUploadError(null);
                startCamera();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 