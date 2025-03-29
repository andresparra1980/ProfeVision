"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ImagePlus, Upload, AlertTriangle, Camera, Loader2, Check, X, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UploadButton } from '@/components/ui/upload-button';
import { UploadDropzone } from '@uploadthing/react';
import { OurFileRouter } from '@/app/api/uploadthing/core';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

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
  qr_data: string;
  total_questions: number;
  answered_questions: number;
  answers: OMRAnswer[];
}

// Expandir las propiedades del componente para incluir callbacks adicionales
interface ExamScannerProps {
  examId?: string;
  studentId?: string;
  groupId?: string;
  onScanComplete?: (result: OMRResult, imageUrl: string) => void;
  allowMultipleScans?: boolean;
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

export function ExamScanner({
  examId,
  studentId,
  groupId,
  onScanComplete,
  allowMultipleScans = false
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

  // Verificar en tiempo de ejecución si UploadThing está configurado
  const isUploadThingConfigured = (): boolean => {
    // Verificar si process.env.UPLOADTHING_SECRET existe
    if (!process.env.NEXT_PUBLIC_UPLOADTHING_URL) {
      return false;
    }
    return true;
  };

  // Limpiar errores
  const clearError = () => {
    setRegistrationError(null);
  };

  // Subir usando método alternativo (archivo local)
  const uploadAlternativeMethod = async (file: File) => {
    try {
      setIsProcessing(true);
      // Implementación del método alternativo...
    } catch (error) {
      console.error('Error en método alternativo:', error);
      setRegistrationError('Error al procesar la imagen con el método alternativo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar la finalización de subida con UploadThing
  const handleUploadComplete = async (fileUrl: string) => {
    try {
      // Registro exitoso
    } catch (error) {
      console.error('Error registrando scan:', error);
      setRegistrationError('Error al registrar el escaneo en el sistema.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar errores de UploadThing
  const handleUploadError = (error: Error) => {
    console.error('Error subiendo imagen:', error);
    setIsProcessing(false);
    setRegistrationError(`Error al subir la imagen: ${error.message}`);
  };
  
  // Función para subir la imagen capturada
  const uploadImage = async () => {
    if (!capturedImage) return;
    
    setUploading(true);
    setUploadError(null);
    setProcessingStatus('processing');
    
    try {
      // Mensajes de progreso
      toast('Preparando imagen', {
        description: 'Procesando imagen en calidad original para análisis...'
      });
      
      // Usar la imagen original sin compresión
      const imageData = capturedImage;
      
      // Extraer parte de datos de base64
      const base64Data = imageData.split(',')[1];
      
      // Preparar payload
      const payload = {
        imageData: base64Data,
        contentType: 'image/png',
        examId,
        studentId,
        groupId
      };
      
      // Mensaje de subida
      toast('Subiendo imagen', {
        description: 'Enviando imagen al servidor para procesamiento OMR...'
      });
      
      // Enviar a API
      const response = await fetch('/api/exams/upload-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        let errorText = 'Error al procesar la imagen';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          // Si no podemos parsear la respuesta, usar mensaje genérico
          errorText = `Error del servidor (${response.status})`;
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      
      // Procesar los resultados del OMR si están disponibles
      if (data.omrResult) {
        setOmrResult(data.omrResult.result);
        setProcessingStatus(data.omrResult.success ? 'completed' : 'error');
        
        // Llamar al callback si existe
        if (onScanComplete && data.omrResult.result) {
          onScanComplete(data.omrResult.result, data.fileUrl);
        }
        
        toast(
          data.omrResult.success ? 'Procesamiento completado' : 'Procesamiento con advertencias', 
          {
            description: `Se identificaron ${data.omrResult.result.answered_questions} respuestas de ${data.omrResult.result.total_questions} preguntas.`
          }
        );
      } else if (data.omrError) {
        setProcessingStatus('error');
        setUploadError('Error en el procesamiento OMR: ' + data.omrError);
        
        toast('Error en procesamiento OMR', {
          description: data.omrError || 'No se pudo procesar correctamente la imagen'
        });
      } else {
        // Si no hay resultados ni error, mostrar un mensaje genérico
        setProcessingStatus('processing');
        toast('Imagen subida correctamente', {
          description: 'La imagen se ha subido, pero aún se está procesando. Los resultados se mostrarán pronto.'
        });
      }
      
      setUploading(false);
    } catch (error) {
      console.error('Error de subida:', error);
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : 'Error desconocido');
      setProcessingStatus('error');
      
      toast('Error al procesar la imagen', {
        description: error instanceof Error ? error.message : 'Error desconocido al procesar la imagen',
        duration: 5000,
      });
    }
  };
  
  // Resetear el escáner
  const resetScanner = () => {
    setCapturedImage(null);
    setOmrResult(null);
    setProcessingStatus('idle');
    setUploadError(null);
    startCamera();
  };
  
  // Renderizar los resultados del OMR
  const renderOMRResults = () => {
    if (!omrResult) return null;
    
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resultados del Escaneo</h3>
          <Badge variant={omrResult.success ? "success" : "destructive"}>
            {omrResult.success ? "Exitoso" : "Error"}
          </Badge>
        </div>
        
        {omrResult.qr_data && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Datos QR</AlertTitle>
            <AlertDescription>{omrResult.qr_data}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Total Preguntas</div>
            <div className="text-xl font-semibold">{omrResult.total_questions}</div>
          </div>
          
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Respondidas</div>
            <div className="text-xl font-semibold">{omrResult.answered_questions}</div>
          </div>
          
          <div className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground">Completitud</div>
            <div className="text-xl font-semibold">
              {Math.round((omrResult.answered_questions / omrResult.total_questions) * 100)}%
            </div>
          </div>
        </div>
        
        <Card className="p-4">
          <h4 className="mb-2 font-medium">Respuestas detectadas:</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {omrResult.answers.map((answer) => (
              <div key={answer.number} className="flex flex-col items-center rounded-md border p-2 text-center">
                <div className="text-xs text-muted-foreground">Pregunta {answer.number}</div>
                <div className="text-xl font-bold">{answer.value}</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(answer.confidence * 100)}% 
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {allowMultipleScans && (
          <Button 
            className="mt-4 w-full" 
            onClick={resetScanner} 
            variant="outline" 
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Escanear otra hoja
          </Button>
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{registrationError}</AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearError} 
            className="mt-2"
          >
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </Alert>
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
                onClick={resetScanner}
                variant="outline"
                className="px-6"
              >
                <X className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              
              <Button
                onClick={uploadImage}
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
          <div className="mt-4 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetScanner}
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