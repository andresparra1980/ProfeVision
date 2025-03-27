"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { AlertCircle, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Declarar cv como variable global
declare const cv: any;

interface ExamScannerProps {
  onScanComplete?: (result: {
    examId: string;
    studentId: string;
    groupId: string;
    timestamp: string;
    imagePath: string;
    answers?: Record<number, string>;
  }) => void;
}

export function ExamScanner({ onScanComplete }: ExamScannerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'available' | 'not-supported' | 'permission-denied'>('checking');
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  // Cargar OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        script.onload = () => {
          if (typeof cv !== 'undefined') {
            cv.onRuntimeInitialized = () => {
              setIsOpenCVLoaded(true);
            };
          }
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading OpenCV:', error);
        toast.error('Error al cargar las herramientas de procesamiento de imagen');
      }
    };

    loadOpenCV();

    return () => {
      const script = document.querySelector('script[src*="opencv.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Verificar soporte de cámara y permisos
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        // Primero verificamos si el navegador soporta mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraStatus('not-supported');
          return;
        }

        // Intentamos obtener la lista de dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (!hasCamera) {
          setCameraStatus('not-supported');
          return;
        }

        // Intentamos obtener permiso de la cámara
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          });
          // Liberamos el stream de prueba
          stream.getTracks().forEach(track => track.stop());
          setCameraStatus('available');
        } catch (permissionError) {
          console.error('Camera permission error:', permissionError);
          setCameraStatus('permission-denied');
        }
      } catch (error) {
        console.error('Error checking camera:', error);
        setCameraStatus('not-supported');
      }
    };

    checkCameraSupport();
  }, []);

  // Iniciar la captura de video
  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraStatus('permission-denied');
      } else {
        setCameraStatus('not-supported');
      }
      toast.error('Error al acceder a la cámara');
    }
  }, []);

  // Detener la captura de video
  const stopCapture = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  }, []);

  // Procesar OMR
  const processOMR = async (imageData: ImageData): Promise<Record<number, string>> => {
    if (!isOpenCVLoaded) {
      throw new Error('OpenCV no está listo');
    }

    // Convertir ImageData a Mat de OpenCV
    const mat = cv.matFromArray(imageData.height, imageData.width, cv.CV_8UC4, imageData.data);
    
    try {
      // Convertir a escala de grises
      const gray = new cv.Mat();
      cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

      // Aplicar threshold adaptativo
      const binary = new cv.Mat();
      cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

      // Encontrar contornos
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // Procesar contornos para encontrar burbujas
      const answers: Record<number, string> = {};
      
      // TODO: Implementar lógica de detección de burbujas y respuestas
      // Por ahora retornamos un objeto vacío
      
      return answers;
    } finally {
      mat.delete();
    }
  };

  // Capturar y procesar imagen
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Configurar canvas al tamaño del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0);

      // Obtener datos de la imagen para procesar QR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (!qrCode) {
        toast.error('No se detectó código QR');
        return;
      }

      try {
        // Parsear datos del QR
        const qrData = JSON.parse(qrCode.data);
        
        // Generar nombre de archivo basado en datos del QR
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `exam_${qrData.examId}_${qrData.studentId}_${timestamp}.png`;

        // Convertir canvas a blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/png');
        });

        // Crear FormData para enviar a la API
        const formData = new FormData();
        formData.append('file', new File([blob], fileName, { type: 'image/png' }));
        formData.append('examData', JSON.stringify(qrData));

        // Enviar a la API
        const response = await fetch('/api/exams/scan', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error al guardar la imagen');
        }

        // Procesar OMR
        const answers = await processOMR(imageData);

        // Notificar completado
        if (onScanComplete) {
          onScanComplete({
            ...qrData,
            imagePath: fileName,
            answers
          });
        }

        toast.success('Examen escaneado correctamente');
        stopCapture();
      } catch (error) {
        console.error('Error processing exam:', error);
        toast.error('Error al procesar el examen');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onScanComplete, stopCapture]);

  // Procesar archivo de imagen
  const processImageFile = async (file: File): Promise<void> => {
    try {
      setIsProcessing(true);

      // Crear FormData con la imagen
      const formData = new FormData();
      formData.append('file', file);

      // Enviar al servidor
      const response = await fetch('/api/exams/process-scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al procesar la imagen');
      }

      const result = await response.json();
      console.log('Resultado del procesamiento:', result);

      // Llamar al callback con los resultados
      if (onScanComplete && result.result) {
        onScanComplete({
          ...result.result.qrData,
          answers: result.result.answers || {},
          timestamp: result.result.timestamp,
          imagePath: URL.createObjectURL(file)
        });
      }

      toast.success('Imagen procesada correctamente');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler para subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await processImageFile(file);
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (cameraStatus === 'checking') {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p>Verificando acceso a la cámara...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de archivo */}
      <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          {isProcessing ? 'Procesando imagen...' : 'Selecciona una imagen o toma una foto con la cámara'}
        </p>
      </div>

      {/* Canvas oculto para procesamiento */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Controles de cámara */}
      <div className="flex justify-center gap-4">
        {!isCapturing ? (
          <Button
            onClick={() => startCapture()}
            disabled={isProcessing || cameraStatus === 'checking'}
          >
            <Camera className="w-4 h-4 mr-2" />
            Usar Cámara
          </Button>
        ) : (
          <>
            <Button
              onClick={captureImage}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Capturar'}
            </Button>
            <Button
              onClick={() => stopCapture()}
              variant="destructive"
              disabled={isProcessing}
            >
              Detener Cámara
            </Button>
          </>
        )}
      </div>

      {/* Vista previa de la cámara */}
      {isCapturing && (
        <div className="relative aspect-video max-w-2xl mx-auto">
          <video
            ref={videoRef}
            className="w-full h-full rounded-lg"
            playsInline
            autoPlay
          />
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
        </div>
      )}

      {/* Mensajes de estado de la cámara */}
      {cameraStatus === 'not-supported' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Tu dispositivo no soporta el acceso a la cámara
          </AlertDescription>
        </Alert>
      )}

      {cameraStatus === 'permission-denied' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se otorgaron permisos para acceder a la cámara
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 