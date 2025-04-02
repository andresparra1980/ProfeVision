"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ImagePlus, Upload, AlertTriangle, Camera, Loader2, Check, X, RefreshCw, AlertCircle, FileText, QrCode, User, UserCheck, UsersRound, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { decodeQRData, DecodedQRData, getReadableQRContent, isValidQRForExam } from '@/lib/utils/qr-code';

// Función para generar un ID único compatible con navegadores antiguos
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Define el tipo para los resultados del OMR
interface OMRAnswer {
  number: number;
  value: string;
  confidence: number;
  num_options: number;
}

interface OMRResult {
  success: boolean;
  answers: OMRAnswer[];
  qr_data: any;  // Cambiado de string a any para aceptar tanto string como objeto
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
  studentId?: string;
  groupId?: string;
  onScanComplete?: (result: OMRResult, imageUrl: string) => void;
  allowMultipleScans?: boolean;
  disableRegistration?: boolean;
  onConnectionError?: () => void;
}

// Función para obtener el tamaño aproximado de una imagen base64
function getBase64Size(base64String: string): number {
  // Eliminar metadatos si existen
  const base64 = base64String.split(',')[1] || base64String;
  // 4 caracteres base64 representan 3 bytes
  return Math.ceil((base64.length * 3) / 4);
}

// Función para comprimir una imagen
function compressImage(base64Image: string, quality = 0.8, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Calcular nueva dimensión manteniendo relación de aspecto
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a formato comprimido
      const compressedImage = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedImage);
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen para compresión'));
    };
    
    img.src = base64Image;
  });
}

// Componente para mostrar información detallada del QR de forma visual
const QRInfo = ({ qrData, examId }: { qrData: string; examId?: string }) => {
  const decodedData = decodeQRData(qrData);
  
  if (!decodedData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error en el código QR</AlertTitle>
        <AlertDescription>El formato del código QR no es reconocido.</AlertDescription>
      </Alert>
    );
  }
  
  // Verificar si el QR pertenece al examen actual (si se proporciona un examId)
  const matchesExam = examId ? decodedData.examId === examId : true;
  
  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center space-x-2 mb-3">
        <QrCode className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Información del código QR</h3>
        <Badge variant={decodedData.isValid ? "success" : "destructive"}>
          {decodedData.isValid ? "Válido" : "Inválido"}
        </Badge>
        {examId && (
          <Badge variant={matchesExam ? "outline" : "destructive"}>
            {matchesExam ? "Coincide con examen" : "No coincide con examen"}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/40">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Examen</div>
            <div className="text-sm font-medium">{decodedData.examId}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/40">
          <User className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Estudiante</div>
            <div className="text-sm font-medium">{decodedData.studentId}</div>
          </div>
        </div>
        
        {decodedData.groupId && (
          <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/40">
            <UsersRound className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Grupo</div>
              <div className="text-sm font-medium">{decodedData.groupId}</div>
            </div>
          </div>
        )}
        
        {!decodedData.isValid && (
          <Alert variant="destructive" className="col-span-1 md:col-span-2 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Código QR inválido</AlertTitle>
            <AlertDescription>
              El hash de verificación no coincide con los datos esperados.
              Esto puede indicar una hoja de respuestas manipulada o un error en el procesamiento.
            </AlertDescription>
          </Alert>
        )}
        
        {examId && !matchesExam && (
          <Alert variant="destructive" className="col-span-1 md:col-span-2 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Examen incorrecto</AlertTitle>
            <AlertDescription>
              Este código QR corresponde a un examen diferente al actual.
              Verifica que estés escaneando la hoja de respuestas correcta.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};

export function ExamScanner({
  examId,
  studentId,
  groupId,
  onScanComplete,
  allowMultipleScans = false,
  disableRegistration = false,
  onConnectionError
}: ExamScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAlternativeMethod, setUseAlternativeMethod] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'available' | 'not-supported' | 'permission-denied'>('checking');
  const [scanning, setScanning] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [omrResult, setOmrResult] = useState<OMRResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fileUploadMode, setFileUploadMode] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [progress, setProgress] = useState({ status: 'idle', percent: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [fileUploadMode]);
  
  // Función para iniciar la cámara
  const startCamera = async () => {
    setCameraStatus('checking');
    
    try {
      // Detener stream anterior si existe
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Verificar si mediaDevices está disponible
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        console.error('MediaDevices API no disponible en este navegador');
        setCameraStatus('not-supported');
        setFileUploadMode(true); // Cambiar automáticamente a modo de carga de archivos
        toast('Cámara no disponible', {
          description: 'No se puede acceder a la cámara. Usando modo de subida de archivos.'
        });
        return;
      }
      
      // Solicitar acceso a la cámara trasera preferentemente
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setCameraStatus('available');
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraStatus('permission-denied');
      } else {
        setCameraStatus('not-supported');
      }
      
      // Cambiar automáticamente a modo de carga de archivos si hay error de cámara
      setFileUploadMode(true);
      toast('Cámara no disponible', {
        description: 'Se utilizará el modo de subida de archivos en su lugar.'
      });
    }
  };

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
  const captureImage = () => {
    if (!videoRef.current || cameraStatus !== 'available') return;
    
    setScanning(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D');
      }
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      setProcessingStatus('idle');
      
      // Detener la cámara para ahorrar recursos
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      toast('Error al capturar la imagen. Intenta de nuevo.');
    } finally {
      setScanning(false);
    }
  };

  // Función para procesar errores de conexión
  const handleConnectionError = useCallback((error: any) => {
    console.error('Error de conexión detectado:', error);
    setErrorMessage('Se detectó un problema de conexión con el servidor');
    if (onConnectionError) {
      onConnectionError();
    }
  }, [onConnectionError]);
  
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
            const response = JSON.parse(xhr.responseText);
            console.log('Respuesta del servidor:', response);
            
            if (response.success) {
              setProgress({ status: 'processing', percent: 100 });
              
              if (response.processInBackground) {
                // El servidor procesará la imagen en segundo plano
                const taskId = response.taskId;
                await processInBackground(taskId);
              } else {
                // Procesamiento inmediato, mostrar resultados
                const omrResult: OMRResult = {
                  success: true,
                  answers: response.answers || [],
                  confidence: response.confidence || 0,
                  qr_data: response.qr_data || response.qrData || null,
                  original_image: response.originalImage || null,
                  processed_image: response.processedImage || null,
                  publicUrl: response.publicUrl || null
                };
                
                setOmrResult(omrResult);
                
                // Usar la URL pública si está disponible, o la imagen procesada/original como fallback
                const imageToDisplay = response.publicUrl || response.processedImage || response.originalImage || null;
                setCapturedImage(imageToDisplay);
                
                if (onScanComplete) {
                  onScanComplete(omrResult, imageToDisplay || '');
                }
              }
            } else {
              // Error en el procesamiento
              setErrorMessage(response.message || 'Error al procesar la imagen');
              const omrResult: OMRResult = {
                success: false,
                message: response.message || 'Error al procesar la imagen',
                error_code: response.errorCode || 'unknown_error',
                error_details: response.error_details || null,
                error: response.error || null,
                publicUrl: response.publicUrl || null,
                answers: [], // Inicializar answers como array vacío
                qr_data: response.qr_data || null, // Añadir qr_data para cumplir con la interfaz
              };
              setOmrResult(omrResult);
              
              // Usar URL pública si está disponible, incluso en caso de error
              const imageToDisplay = response.publicUrl || response.originalImage || '';
              
              if (onScanComplete) {
                onScanComplete(omrResult, imageToDisplay);
              }
            }
          } catch (parseError) {
            console.error('Error al procesar respuesta del servidor:', parseError);
            setErrorMessage('Error al procesar la respuesta del servidor');
            
            // Verificar si es un error de conexión o de formato
            if (xhr.responseText.includes('<!DOCTYPE html>') || xhr.responseText.trim() === '') {
              handleConnectionError(new Error('Respuesta del servidor en formato incorrecto'));
            }
          }
        } else {
          // Error HTTP
          console.error('Error HTTP:', xhr.status, xhr.statusText);
          
          let errorMessage = `Error del servidor: ${xhr.status} ${xhr.statusText}`;
          let parsedError = null;
          
          try {
            parsedError = JSON.parse(xhr.responseText);
            errorMessage = parsedError.message || errorMessage;
          } catch (e) {
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
            qr_data: undefined // Añadir qr_data para cumplir con la interfaz
          };
          
          setOmrResult(omrResult);
          
          if (onScanComplete) {
            onScanComplete(omrResult, '');
          }
        }
      };
      
      xhr.onerror = function() {
        console.error('Error de red al subir la imagen');
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
          qr_data: undefined // Añadir qr_data para cumplir con la interfaz
        };
        
        setOmrResult(omrResult);
        
        if (onScanComplete) {
          onScanComplete(omrResult, '');
        }
      };
      
      xhr.timeout = 60000; // 60 segundos de timeout
      xhr.ontimeout = function() {
        console.error('Timeout al subir la imagen');
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
          qr_data: undefined // Añadir qr_data para cumplir con la interfaz
        };
        
        setOmrResult(omrResult);
        
        if (onScanComplete) {
          onScanComplete(omrResult, '');
        }
      };
      
      xhr.open('POST', '/api/exams/process-scan', true);
      xhr.send(formData);
      
      } catch (error) {
      console.error('Error al subir la imagen:', error);
      setErrorMessage('Error al iniciar la carga de la imagen');
      
      // Error general, podría ser de conexión o local
      if (error instanceof Error && 
          (error.message.includes('network') || error.message.includes('connection'))) {
        handleConnectionError(error);
      }
      
      const omrResult: OMRResult = {
        success: false,
        message: 'Error al iniciar la carga de la imagen',
        error_code: 'upload_init_error',
        error_details: {
          type: 'upload_error',
          code: 'upload_init_error',
          message: error instanceof Error ? error.message : String(error),
          recommendations: ['Intente con una imagen diferente', 'Verifique su conexión a internet']
        },
        error: undefined,
        publicUrl: undefined,
        answers: [], // Inicializar answers como array vacío
        qr_data: undefined // Añadir qr_data para cumplir con la interfaz
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
            const statusText = response.statusText;
            console.error(`Error al verificar estado (${response.status}): ${statusText}`);
            
            // Si es un error 5xx, podría ser un problema de conexión o del servidor
            if (response.status >= 500) {
              handleConnectionError(new Error(`Error del servidor al verificar estado: ${response.status}`));
              throw new Error(`Error del servidor: ${response.status} ${statusText}`);
            }
            
            const errorData = await response.json().catch(() => ({ 
              message: `Error HTTP: ${response.status} ${statusText}` 
            }));
            
            throw new Error(errorData.message || `Error ${response.status}: ${statusText}`);
          }
          
          const data = await response.json();
          
          if (data.status === 'completed') {
            completed = true;
            setProgress({ status: 'processing', percent: 100 });
            
            if (data.result.success) {
              const omrResult: OMRResult = {
                success: true,
                answers: data.result.answers || [],
                confidence: data.result.confidence || 0,
                qr_data: data.result.qrData || null,
                original_image: data.result.originalImage || null,
                processed_image: data.result.processedImage || null,
                publicUrl: data.result.publicUrl || null
              };
              
              setOmrResult(omrResult);
              
              // Usar la URL pública si está disponible, o la imagen procesada/original como fallback
              const imageToDisplay = data.result.publicUrl || data.result.processedImage || data.result.originalImage || null;
              setCapturedImage(imageToDisplay);
              
              if (onScanComplete) {
                onScanComplete(omrResult, imageToDisplay || '');
              }
            } else {
              // Procesamiento completado pero con error
              setErrorMessage(data.result.message || 'Error al procesar la imagen');
              
              const omrResult: OMRResult = {
                success: false,
                message: data.result.message || 'Error al procesar la imagen',
                error_code: data.result.errorCode || 'processing_error',
                error_details: data.result.errorDetails || null,
                error: data.result.error || null,
                publicUrl: data.result.publicUrl || null,
                answers: [], // Inicializar answers como array vacío
                qr_data: data.result.qrData || null, // Añadir qr_data para cumplir con la interfaz
              };
              
              setOmrResult(omrResult);
              
              if (onScanComplete) {
                onScanComplete(omrResult, data.result.originalImage || '');
              }
            }
          } else if (data.status === 'failed') {
            completed = true;
            throw new Error(data.error || 'El procesamiento ha fallado');
          } else {
            // Aún procesando, esperar 2 segundos antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (pollError) {
          console.error('Error en el polling:', pollError);
          
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
      console.error('Error en processInBackground:', error);
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
        qr_data: undefined // Añadir qr_data para cumplir con la interfaz
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
                <p className="font-medium">{omrResult.qr_data.examId || 'No disponible'}</p>
              </div>
              <div className="bg-muted rounded-md p-2">
                <span className="text-xs text-muted-foreground">ID Estudiante</span>
                <p className="font-medium">{omrResult.qr_data.studentId || 'No disponible'}</p>
              </div>
              {omrResult.qr_data.groupId && (
                <div className="bg-muted rounded-md p-2">
                  <span className="text-xs text-muted-foreground">Grupo</span>
                  <p className="font-medium">{omrResult.qr_data.groupId}</p>
                </div>
              )}
              <div className="bg-muted rounded-md p-2">
                <span className="text-xs text-muted-foreground">Validación</span>
                <p className="font-medium flex items-center gap-1">
                  {omrResult.qr_data.isValid 
                    ? <><Check className="h-4 w-4 text-green-500" /> Válido</>
                    : <><XCircle className="h-4 w-4 text-red-500" /> Inválido</>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      {!capturedImage && !uploading && (
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
          <img 
            src={capturedImage} 
            alt="Imagen capturada" 
            className="h-full w-full object-contain" 
          />
          
          {uploading && (
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
          {!uploading && processingStatus === 'idle' && (
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