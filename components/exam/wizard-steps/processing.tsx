import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRData, ProcessingResult, DuplicateInfo } from '../types';
import { useImageContext } from '../contexts';
import logger from '@/lib/utils/logger';
import Image from 'next/image';

// Configurar flag de debug para mensajes de consola
const DEBUG = process.env.NODE_ENV === 'development';

type StatusType = 
  | 'idle' 
  | 'processing' 
  | 'checking_duplicates'
  | 'complete' 
  | 'error' 
  | 'duplicate';

// Define the type for the duplicate check response
interface DuplicateCheckResponse {
  exists: boolean;
  duplicateInfo?: DuplicateInfo;
}

export function Processing() {
  const t = useTranslations('wizard-step-processing');
  const { 
    processedImageData, 
    qrValidation: _qrValidation, 
    clearImageData, 
    setQrValidation, 
    setFinalOutput,
    setProcessedImageData: _setProcessedImageData,
    onProcessingComplete
  } = useImageContext();
  
  const [status, setStatus] = useState<StatusType>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<DuplicateInfo | null>(null);
  
  const processingCompleted = useRef(false);
  const processingInProgress = useRef(false);

  // Helper function to check for duplicates
  const checkForDuplicates = async (qrData: QRData | null): Promise<DuplicateCheckResponse | null> => {
    if (!qrData) return null;
    
    // Skip duplicate check for incomplete or placeholder QR data
    if (!qrData.examId || !qrData.studentId || 
        qrData.examId === 'placeholder-exam-id' || 
        qrData.studentId === 'placeholder-student-id') {
      return null;
    }
    
    try {
      setStatus('checking_duplicates');
      const response = await fetch('/api/exams/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });
      
      if (!response.ok) {
        if (DEBUG) logger.error('Error checking for duplicates: Server responded with', response.status);
        return null;
      }
      
      const data = await response.json() as DuplicateCheckResponse;
      return data;
    } catch (error) {
      if (DEBUG) logger.error('Error checking for duplicates:', error);
      return null;
    }
  };

  // Memoizamos la función processImage para evitar recreaciones en cada renderizado
  const processImage = useCallback(async () => {
    if (!processedImageData || processingInProgress.current || processingCompleted.current) return;
  
    processingInProgress.current = true;
    setStatus('processing');
    setErrorMessage(null);
    
    try {
      // Prepare form data with the image
      const formData = new FormData();
      // Convert the data URL to a blob
      const blob = await fetch(processedImageData).then(r => r.blob());
      // Important: The field must be named 'scan' as expected by the API
      formData.append('scan', blob, 'scan.jpg');

      if (DEBUG) {
        logger.log('Submitting image for processing, size:', blob.size, 'bytes');
      }

      // Call the API to process the image
      const response = await fetch('/api/exams/process-scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const statusCode = response.status;
        throw new Error(`API error (${statusCode}): ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatus('complete');
        processingCompleted.current = true;
        
        // Properly prepare QR data in standardized format
        let parsedQrData = data.result?.qr_data || null;
        
        // Debug the QR data from the API
        if (DEBUG) {
          logger.log('QR data received from API:', parsedQrData);
        }
        
        // If QR data is a string, try to parse it
        if (typeof parsedQrData === 'string') {
          try {
            // See if it's JSON
            parsedQrData = JSON.parse(parsedQrData);
          } catch (_e) {
            // Not JSON, but could be a colon-separated format
            if (parsedQrData.includes(':') && parsedQrData.includes('-')) {
              const parts = parsedQrData.split(':');
              if (parts.length >= 3) {
                // Format is examId:studentId:groupId[:hash]
                parsedQrData = {
                  examId: parts[0],
                  studentId: parts[1],
                  groupId: parts[2],
                  version: parts[3] || '1'
                };
              }
            }
          }
        }
        
        // Ensure QR data has the right structure with explicit properties
        const normalizedQrData = {
          examId: parsedQrData?.examId || null,
          studentId: parsedQrData?.studentId || null,
          groupId: parsedQrData?.groupId || null,
          version: parsedQrData?.version || '1'
        };
        
        // --> Add check for invalid scan result <--
        const noAnswersFound = !data.result?.answers || Object.keys(data.result.answers).length === 0;
        if (!normalizedQrData.examId && !normalizedQrData.studentId && noAnswersFound) {
          setStatus('error');
          setErrorMessage(t('messages.invalidExamDetected'));
          processingInProgress.current = false;
          processingCompleted.current = false; // Not successfully completed
          return; // Stop processing
        }
        // <-- End check -->
        
        // Check if the QR data contains placeholder IDs
        const isManualScan = !normalizedQrData.examId || 
          !normalizedQrData.studentId || 
          normalizedQrData.examId === 'placeholder-exam-id' || 
          normalizedQrData.studentId === 'placeholder-student-id';
        
        let duplicateData = null;
        if (!isManualScan) {
          // Only check for duplicates if we have valid IDs
          const duplicateResponse = await checkForDuplicates(normalizedQrData);
          if (duplicateResponse?.exists && duplicateResponse.duplicateInfo) {
            setDuplicateData(duplicateResponse.duplicateInfo);
            duplicateData = duplicateResponse;
          }
        }

        if (DEBUG) {
          const debugInfo = {
            qrData: normalizedQrData,
            responseKeys: Object.keys(data),
            resultKeys: data.result ? Object.keys(data.result) : [],
            processedImageUrl: data.processedImageUrl,
            processedImagePath: data.result?.processed_image_path,
            originalImagePath: data.result?.original_image_path || data.publicUrl
          };
          logger.log('API Response debug info:', debugInfo);
        }

        const _result: ProcessingResult = {
          ...data,
          isManualScan: isManualScan || false,
          isDuplicate: duplicateData?.exists || false,
          duplicateInfo: duplicateData?.duplicateInfo || undefined,
        };

        // Set QR validation with the normalized data
        setQrValidation({
          validated: true,
          data: normalizedQrData
        });
        
        // Determine processed image URL - prefer the direct URL from API response
        const processedImg = data.processedImageUrl || 
                             data.result?.processed_image_path || 
                             '';
                             
        if (DEBUG) {
          logger.log('Using processed image URL:', processedImg);
          logger.log('Original image URL:', processedImageData);
          // Log the extracted processedImageUrl from response data
          logger.log('processedImageUrl from API:', {
            directUrl: data.processedImageUrl,
            fromResult: data.result?.processed_image_path,
            publicUrl: data.publicUrl,
            responseKeys: Object.keys(data)
          });
        }
        
        const finalOutput = {
          qrData: normalizedQrData,
          answers: data.result?.answers || data.answers || {},
          originalImage: processedImageData,
          // Force use different URL for processed image to avoid using the same image
          processedImage: (processedImg && processedImg !== processedImageData) 
                          ? processedImg 
                          : (data.publicUrl && data.publicUrl !== processedImageData)
                            ? data.publicUrl
                            : data.result?.processed_image_path || '',
        };
        
        if (DEBUG) {
          logger.log('Setting final output:', finalOutput);
        }
        
        setFinalOutput(finalOutput);
        
        // Trigger the callback if it exists
        if (onProcessingComplete) {
          onProcessingComplete();
        }
      } else {
        setStatus('error');
        setErrorMessage(data.error_details?.message || data.error || 'Error processing image');
      }
    } catch (error) {
      const genericErrorMessage = t('messages.genericProcessingError');
      let specificErrorMessage = genericErrorMessage;

      if (DEBUG) {
        logger.error('Error processing image:', error);
      }
      
      // Check if the error message indicates the specific "processed image not found" scenario
      if (error instanceof Error && error.message.includes('imagen procesada no encontrada')) {
        specificErrorMessage = NO_EXAM_DETECTED_MSG; // Use the specific user-friendly message
      }
      
      // Just set error state directly without retry
      setStatus('error');
      setErrorMessage(specificErrorMessage); // Set the determined message
      processingInProgress.current = false;
      processingCompleted.current = false; // Ensure it's not marked as completed
    }
  }, [processedImageData, setQrValidation, setFinalOutput, onProcessingComplete]);

  // Set processedImageData when component mounts
  useEffect(() => {
    // Component setup on mount
    setStatus('idle');
    
    // Auto-process the image when it becomes available
    if (processedImageData && !processingInProgress.current && !processingCompleted.current) {
      processImage();
    }

    return () => {
      // Cleanup when component unmounts
    };
  }, [processedImageData, processImage]);

  // Reiniciar el estado cuando se cambia de imagen
  useEffect(() => {
    return () => {
      processingCompleted.current = false;
    };
  }, [processedImageData]);

  const handleRetake = async () => {
    // Only call clearImageData - this should trigger the parent wizard
    clearImageData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(t('locale'), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mensaje específico para cuando no se detecta examen válido
  const NO_EXAM_DETECTED_MSG = t('messages.noExamDetected');

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6 w-full">
      <h2 className="text-xl font-bold text-center">
        {status === 'idle' ? t('states.processing') :
         status === 'processing' ? t('states.processing') :
         status === 'checking_duplicates' ? t('states.checkingDuplicates') :
         status === 'complete' ? t('states.complete') :
         status === 'duplicate' ? t('states.duplicate') :
         status === 'error' && errorMessage === NO_EXAM_DETECTED_MSG ? t('states.examNotDetected') :
         status === 'error' ? t('states.error') :
         t('states.processing')}
      </h2>
      
      <div className="w-full max-w-md relative">
        {/* Imagen previa o procesada */}
        <div className="relative w-full aspect-[3/4] border border-gray-300 rounded-lg overflow-hidden bg-gray-50 mb-2">
          {status === 'processing' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
              <RefreshCw className="animate-spin h-12 w-12 text-blue-500" />
            </div>
          ) : null}
          
          {/* Mostrar la imagen procesada o la original */}
          {processedImageData && (
            <div className="relative w-full h-full">
              <Image 
                src={processedImageData} 
                alt={t('messages.processedImageAlt')} 
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain"
                unoptimized={processedImageData.startsWith('data:')}
                priority
              />
            </div>
          )}
          
          {/* Sobreponer icono y mensaje de estado/error */}
          {status !== 'processing' && (
            <div 
              className="absolute bottom-0 left-0 right-0 p-2 z-10 flex items-center justify-center text-center"
              style={{
                backgroundColor: 
                  status === 'complete' ? 'rgba(34, 197, 94, 0.8)' :
                  status === 'duplicate' ? 'rgba(249, 115, 22, 0.8)' :
                  status === 'error' && errorMessage === NO_EXAM_DETECTED_MSG ? 'rgba(249, 115, 22, 0.8)' :
                  status === 'error' ? 'rgba(239, 68, 68, 0.8)' :
                  'transparent'
              }}
            >
              <p className="text-white text-sm font-medium">
                {status === 'complete' && t('messages.processingSuccess')}
                {status === 'duplicate' && (duplicateData ? t('messages.duplicateWithDate', { date: formatDate(duplicateData.fecha_calificacion) }) : t('messages.duplicateGeneric'))}
                {status === 'error' && errorMessage}
              </p>
            </div>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-center space-x-4">
          {/* Botón de retomar foto (visible excepto durante procesamiento) */}
          {status !== 'processing' && (
            <Button 
              onClick={handleRetake}
              className="px-4"
            >
              {t('buttons.retakePhoto')}
            </Button>
          )}
          
          {/* Botón de reintento (solo visible en caso de error GENÉRICO) */}
          {status === 'error' && errorMessage !== NO_EXAM_DETECTED_MSG && (
            <Button
              onClick={() => {
                processingCompleted.current = false;
                processImage();
              }}
              className="px-6 bg-primary"
            >
              {t('buttons.retry')}
              <RefreshCw className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {/* Botón de continuar (visible en estados idle, complete, duplicate, pero no en processing) */}
          {(status === 'idle' || status === 'complete' || status === 'duplicate') && (
            <Button
              onClick={processImage}
              className="px-6"
            >
              {status === 'duplicate' ? t('buttons.continueAnyway') : t('buttons.continue')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 