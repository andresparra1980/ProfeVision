import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRData, ProcessingResult, DuplicateInfo, OMRDirectResponse, OMRLegacyResponse } from '../types';
import { useImageContext } from '../contexts';
import logger from '@/lib/utils/logger';
import Image from 'next/image';
import { useOMREndpoint } from '@/lib/hooks/useOMREndpoint';
import { getSupabaseJWT } from '@/lib/utils/jwt';

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

  const { endpointUrl, shouldUseDirect, fallbackToLegacy } = useOMREndpoint();

  const [status, setStatus] = useState<StatusType>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<DuplicateInfo | null>(null);

  const processingCompleted = useRef(false);
  const processingInProgress = useRef(false);

  // Mensaje específico para cuando no se detecta examen válido
  const NO_EXAM_DETECTED_MSG = t('messages.noExamDetected');

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

      let data: OMRLegacyResponse;

      if (shouldUseDirect) {
        // ========== DIRECT API (New) ==========
        try {
          // Get JWT from Supabase session
          const jwt = await getSupabaseJWT();
          if (!jwt) {
            throw new Error('No authentication token available');
          }

          // Direct API expects field named 'file'
          formData.append('file', blob, 'scan.jpg');

          if (DEBUG) {
            logger.log('Using OMR Direct API:', endpointUrl);
            logger.log('Image size:', blob.size, 'bytes');
          }

          // Call direct API with JWT auth
          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwt}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const _errorText = await response.text();
            const statusCode = response.status;

            // If direct API fails, fallback to legacy
            if (DEBUG) {
              logger.warn(`Direct API failed (${statusCode}), falling back to legacy`);
            }
            fallbackToLegacy();

            // Retry with legacy API
            throw new Error('FALLBACK_TO_LEGACY');
          }

          const directData: OMRDirectResponse = await response.json();

          // Direct API response format is different - transform to legacy format
          if (directData.success) {
            data = {
              success: true,
              result: {
                qr_data: directData.qr_data || undefined,
                answers: directData.answers,
              },
              // Direct API returns both images as base64
              processedImage: directData.processed_image,
              publicUrl: directData.original_image || undefined,
            };

            if (DEBUG) {
              logger.log('Direct API response:', {
                qr_data: directData.qr_data,
                answers_count: directData.answers?.length || 0,
                original_image_size: directData.original_image?.length || 0,
                processed_image_size: directData.processed_image?.length || 0,
              });
            }
          } else {
            data = {
              success: false,
              error: directData.error,
            };
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'FALLBACK_TO_LEGACY') {
            // Fallback to legacy API
            const legacyFormData = new FormData();
            legacyFormData.append('scan', blob, 'scan.jpg');

            const response = await fetch('/api/exams/process-scan', {
              method: 'POST',
              body: legacyFormData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              const statusCode = response.status;
              throw new Error(`API error (${statusCode}): ${errorText}`);
            }

            data = await response.json() as OMRLegacyResponse;
          } else {
            throw error;
          }
        }
      } else {
        // ========== LEGACY API (Via Vercel) ==========
        // Important: The field must be named 'scan' as expected by the legacy API
        formData.append('scan', blob, 'scan.jpg');

        if (DEBUG) {
          logger.log('Using legacy API via Vercel');
          logger.log('Submitting image for processing, size:', blob.size, 'bytes');
        }

        // Call the legacy API to process the image
        const response = await fetch('/api/exams/process-scan', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          const statusCode = response.status;
          throw new Error(`API error (${statusCode}): ${errorText}`);
        }

        data = await response.json() as OMRLegacyResponse;
      }

      if (data.success) {
        setStatus('complete');
        processingCompleted.current = true;
        
        // Properly prepare QR data in standardized format
        let parsedQrData: string | QRData | null = data.result?.qr_data || null;

        // Debug the QR data from the API
        if (DEBUG) {
          logger.log('QR data received from API:', parsedQrData);
        }

        // If QR data is a string, try to parse it
        if (typeof parsedQrData === 'string') {
          const qrString = parsedQrData; // Create const for type narrowing
          try {
            // See if it's JSON
            parsedQrData = JSON.parse(qrString) as QRData;
          } catch (_e) {
            // Not JSON, but could be a colon-separated format
            if (qrString.includes(':') && qrString.includes('-')) {
              const parts = qrString.split(':');
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
        const normalizedQrData: QRData = {
          examId: (typeof parsedQrData === 'object' && parsedQrData?.examId) || '',
          studentId: (typeof parsedQrData === 'object' && parsedQrData?.studentId) || '',
          groupId: (typeof parsedQrData === 'object' && parsedQrData?.groupId) || undefined,
          version: (typeof parsedQrData === 'object' && parsedQrData?.version) || '1'
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
            processedImage: data.processedImage ? 'base64 present' : null,
            processedImageUrl: data.processedImageUrl,
            originalImagePath: data.publicUrl
          };
          logger.log('API Response debug info:', debugInfo);
        }

        const _result: ProcessingResult = {
          success: data.success,
          processedImage: data.processedImage,
          processedImageUrl: data.processedImageUrl,
          publicUrl: data.publicUrl,
          qrData: normalizedQrData,
          result: data.result ? {
            processed_image_path: data.result.processed_image_path,
            answers: data.result.answers,
            qr_data: normalizedQrData,
          } : undefined,
          answers: data.answers,
          isManualScan: isManualScan || false,
          isDuplicate: duplicateData?.exists || false,
          duplicateInfo: duplicateData?.duplicateInfo || undefined,
          error_details: data.error_details,
        };

        // Set QR validation with the normalized data
        setQrValidation({
          validated: true,
          data: normalizedQrData
        });
        
        // Determine processed image URL - prefer base64 (Vercel) or URL (VPS) from API response
        const processedImg = data.processedImage ||    // Vercel: base64 image
                             data.processedImageUrl || // VPS: public URL
                             '';
                             
        if (DEBUG) {
          logger.log('Using processed image URL:', processedImg);
          logger.log('Original image URL:', processedImageData);
          // Log the extracted processedImage/URL from response data
          logger.log('processedImage from API:', {
            base64: data.processedImage ? `base64 (${data.processedImage.substring(0, 50)}...)` : null,
            urlVPS: data.processedImageUrl,
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
                            : '',
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
  }, [processedImageData, setQrValidation, setFinalOutput, onProcessingComplete, NO_EXAM_DETECTED_MSG, t, shouldUseDirect, endpointUrl, fallbackToLegacy]);

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