import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ProcessingProps {
  imageUrl: string;
  onComplete: (data: any) => void;
  onRetake: () => void;
  onNext: () => void;
}

export function Processing({ imageUrl, onComplete, onRetake, onNext }: ProcessingProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'duplicate'>('loading');
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const processingCompleted = useRef(false);

  useEffect(() => {
    // Evitar procesamiento duplicado
    if (processingCompleted.current) return;
    
    const processImage = async () => {
      setStatus('loading');
      
      try {
        // Convertir el blob URL a File para procesar
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const imageFile = new File([blob], 'exam-scan.jpg', { type: 'image/jpeg' });
        
        console.log('Archivo de imagen creado:', imageFile.name, imageFile.type, imageFile.size);
        
        // Crear FormData para el endpoint de escaneo
        const formData = new FormData();
        // Usar sólo el campo 'file' como espera el endpoint
        formData.append('file', imageFile);
        
        formData.append('examId', ''); // Campo vacío para el ID del examen
        formData.append('studentId', ''); // Campo vacío para el ID del estudiante
        formData.append('job_id', `manual-scan-${Date.now()}`);
        formData.append('source', 'manual');
        formData.append('save_result', 'true');
        
        // Imprimir keys para debug
        console.log('FormData keys: file, examId, studentId, job_id, source, save_result');
        
        // Enviar directamente al endpoint de process-scan
        const omrResponse = await fetch('/api/exams/process-scan', {
          method: 'POST',
          body: formData,
        });
        
        // Log para debuggear
        const responseText = await omrResponse.text();
        console.log('Respuesta del servidor:', responseText);
        
        if (!omrResponse.ok) {
          throw new Error(`Error en el procesamiento OMR: ${omrResponse.status}`);
        }
        
        const omrData = JSON.parse(responseText);
        console.log('Datos de OMR recibidos:', omrData);
        setProcessingResult(omrData);
        
        if (omrData.success) {
          // Si hay una imagen procesada, mostrarla
          let imageUrl = null;
          if (omrData.processedImageUrl) {
            imageUrl = omrData.processedImageUrl;
          } else if (omrData.publicUrl) {
            imageUrl = omrData.publicUrl;
          } else if (omrData.result && omrData.result.processed_image_path) {
            imageUrl = `/uploads/${omrData.result.processed_image_path.split('/').pop()}`;
          }
          
          setProcessedImageUrl(imageUrl);
          
          // Extraer datos del QR
          const qrData = omrData.qr_data || omrData.result?.qr_data || null;
          
          // Verificar si el examen ya ha sido calificado
          if (qrData && (qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id) && 
                        (qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id)) {
            
            const examId = qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id;
            const studentId = qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id;
            
            try {
              console.log('Verificando si el examen ya ha sido calificado:', { examId, studentId });
              // Verificar si ya existe un resultado para este examen y estudiante
              const checkDuplicateResponse = await fetch(`/api/exams/check-duplicate?examId=${examId}&studentId=${studentId}`);
              
              if (!checkDuplicateResponse.ok) {
                const errorData = await checkDuplicateResponse.json();
                console.error('Error al verificar duplicados:', errorData);
                // Continuar con el flujo normal aunque haya habido un error
              } else {
                const checkDuplicateData = await checkDuplicateResponse.json();
                
                if (checkDuplicateData.exists) {
                  // Examen ya calificado
                  console.log('Examen ya calificado:', checkDuplicateData);
                  
                  // Inmediatamente establecer el estado a 'duplicate' (esto es importante)
                  setStatus('duplicate');
                  
                  setDuplicateInfo({
                    examId: examId,
                    studentId: studentId,
                    resultadoId: checkDuplicateData.resultadoId,
                    fecha: checkDuplicateData.fecha_calificacion,
                    puntaje: checkDuplicateData.puntaje,
                    porcentaje: checkDuplicateData.porcentaje
                  });
                  
                  // Marcar el procesamiento como completado
                  processingCompleted.current = true;
                  
                  // Modificar los datos del QR para incluir la información del duplicado
                  qrData.isDuplicate = true;
                  qrData.duplicateInfo = checkDuplicateData;
                  
                  // Añadir logs para depuración
                  console.log('Estado actualizado a duplicate:', 'duplicate');
                  console.log('Información de duplicado:', {
                    examId, 
                    studentId, 
                    resultadoId: checkDuplicateData.resultadoId
                  });
                  
                  // Preparar los datos del resultado para el componente padre
                  const resultData = {
                    processedImage: imageUrl,
                    qrData: qrData,
                    answers: omrData.answers || omrData.result?.answers || [],
                    isDuplicate: true,
                    duplicateInfo: checkDuplicateData
                  };
                  
                  // Notificar al componente padre
                  onComplete(resultData);
                  return; // Importante para evitar que el código posterior se ejecute
                }
              }
            } catch (error) {
              console.error('Error al verificar duplicados:', error);
              // Continuar con el flujo normal si no se puede verificar
            }
          }
          
          // Si es duplicado o no se pudo verificar, continuar con el flujo normal
          if (status !== 'error') {
            setStatus(status === 'duplicate' ? 'duplicate' : 'success');
            processingCompleted.current = true;
            
            // Preparar los datos para el componente padre, normalizando la estructura de las respuestas
            const resultAnswers = omrData.answers || omrData.result?.answers || [];
            console.log('Enviando respuestas al componente Results:', resultAnswers);
            
            const resultData = {
              processedImage: imageUrl,
              qrData: qrData,
              answers: resultAnswers,
              isDuplicate: status === 'duplicate'
            };
            
            // Notificar al componente padre del resultado
            onComplete(resultData);
          }
        } else {
          setErrorDetails(omrData.error_details || {
            message: 'Error desconocido en el procesamiento',
            recommendations: ['Intenta capturar la imagen nuevamente']
          });
          setStatus('error');
          processingCompleted.current = true;
        }
      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        setStatus('error');
        setErrorDetails({
          message: error instanceof Error ? error.message : 'Error desconocido',
          recommendations: ['Intenta nuevamente', 'Verifica tu conexión a internet']
        });
        processingCompleted.current = true;
      }
    };
    
    if (imageUrl) {
      processImage();
    }
  }, [imageUrl, onComplete]);

  // Reiniciar el estado cuando se cambia de imagen
  useEffect(() => {
    return () => {
      processingCompleted.current = false;
    };
  }, [imageUrl]);

  const handleRetake = () => {
    processingCompleted.current = false;
    onRetake();
  };

  const handleNext = () => {
    onNext();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-center">Procesando Imagen</h2>
      
      <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden p-4">
        <img 
          src={processedImageUrl || imageUrl} 
          alt="Imagen del examen" 
          className="w-full h-auto max-h-[40vh] object-contain mx-auto mb-4"
        />
        
        <div className="flex justify-center items-center py-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Procesando imagen...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center text-green-600">
              <CheckCircle2 className="h-12 w-12" />
              <p className="mt-2 font-medium">¡Procesamiento exitoso!</p>
              <p className="text-sm text-gray-600 text-center mt-1">
                Se han detectado {processingResult?.answers?.length || processingResult?.result?.answers?.length || 0} respuestas
              </p>
            </div>
          )}
          
          {status === 'duplicate' && (
            <div className="flex flex-col items-center text-orange-600 border-2 border-orange-300 bg-orange-50 p-4 rounded-lg">
              <AlertTriangle className="h-12 w-12" />
              <p className="mt-2 font-medium text-lg">¡Examen ya calificado!</p>
              {duplicateInfo && (
                <div className="text-sm text-orange-700 text-center mt-2 space-y-2">
                  <p className="font-medium">Este examen ya fue calificado el {formatDate(duplicateInfo.fecha)}.</p>
                  <div className="bg-white p-3 rounded-md border border-orange-200 mb-2">
                    <p className="font-medium text-orange-800 mb-1">Calificación anterior:</p>
                    <div className="flex justify-between">
                      <span>Puntaje obtenido:</span>
                      <span className="font-medium">{duplicateInfo.puntaje || 0} puntos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Porcentaje:</span>
                      <span className="font-medium">{duplicateInfo.porcentaje || 0}%</span>
                    </div>
                  </div>
                  <p className="font-medium mt-2">¿Desea continuar y reemplazar la calificación anterior?</p>
                </div>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="mt-2 font-medium text-red-600">{errorDetails?.message || 'Error en el procesamiento'}</p>
              
              {errorDetails?.recommendations && (
                <div className="mt-4 bg-red-50 p-3 rounded-lg w-full">
                  <p className="text-sm font-medium text-red-800 mb-2">Recomendaciones:</p>
                  <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                    {errorDetails.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Button
          variant="outline"
          onClick={handleRetake}
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Volver a capturar
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={status === 'loading' || status === 'error'}
          className={`flex items-center justify-center gap-2 ${status === 'duplicate' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary'}`}
        >
          {status === 'duplicate' ? 'Continuar y reemplazar' : 'Continuar'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 