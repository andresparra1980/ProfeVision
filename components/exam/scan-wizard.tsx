import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Instructions, ImageCapture, Processing, Results, Confirmation } from './wizard-steps';
import { ScanData, ProcessingResult } from './types';
import { ImageProvider, useImageContext } from './contexts';
import logger from '@/lib/utils/logger';

// Debug flag
const DEBUG = process.env.NODE_ENV === 'development';

interface ScanWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Inner content component that uses the ImageContext
function ScanWizardContent({ onClose }: { onClose: () => void }) {
  const { 
    setProcessedImageData, 
    setOnProcessingComplete,
    finalOutput,
    processedImageData,
    clearImageData
  } = useImageContext();
  
  const [step, setStep] = useState(1);
  const [scanData, setScanData] = useState<ScanData>({});
  const processingImage = useRef(false); // Ref to track processing status
  const processedImageId = useRef<string | null>(null); // Track the current image being processed

  // Set up the callback only once on mount, to avoid the "Cannot update a component while rendering" error
  useEffect(() => {
    // Set the callback for when processing completes
    setOnProcessingComplete(() => {
      return (result: ProcessingResult) => {
        // Este callback se ejecutará cuando el procesamiento se complete
        if (result) {
          // Update local state with results from context
          setScanData((prev) => ({
            ...prev,
            processedImage: result.processedImage,
            qrData: result.qrData || result.qr_data,
            answers: Array.isArray(result.answers) ? result.answers : [],
          }));
          setStep(4);
        }
      };
    });
    
    return () => {
      // Clean up the callback on unmount
      setOnProcessingComplete(null);
    };
  }, [setOnProcessingComplete]); // Quitamos finalOutput de las dependencias

  // Watch for finalOutput changes - este efecto es independiente
  useEffect(() => {
    if (finalOutput) {
      if (DEBUG) {
        logger.log('Actualización desde finalOutput:', finalOutput);
      }
      
      // Update local state with results from context
      setScanData((prev) => ({
        ...prev,
        processedImage: finalOutput.processedImage || null,
        originalImage: finalOutput.originalImage || prev.originalImage,
        qrData: finalOutput.qrData,
        answers: Array.isArray(finalOutput.answers) ? finalOutput.answers : [],
      }));
      
      // If we're on processing step, move to results
      if (step === 3) {
        setStep(4);
      }
    }
  }, [finalOutput, step]);

  const handleRetake = useCallback(() => {
    // Reset processing flags when retaking
    processingImage.current = false;
    processedImageId.current = null;
    
    // Reset any existing results data
    setScanData((prev) => ({
      ...prev,
      originalImage: undefined,
      processedImage: null,
      qrData: null,
      answers: undefined,
      isDuplicate: false,
      duplicateInfo: null,
    }));
    
    // Asegurarse de limpiar la imagen en el contexto también
    clearImageData();
    
    // Go back to the capture step
    setStep(2);
  }, [setScanData, setStep, clearImageData]);

  // Effect to automatically return to capture step if image data is cleared
  useEffect(() => {
    if (!processedImageData && step > 2) {
      if (DEBUG) {
        logger.log('Image data cleared in context, returning to capture step (step 2).');
      }
      handleRetake(); // Call the existing function to go back to step 2
    }
    // It's important handleRetake is stable or included if it changes.
    // In this case, handleRetake doesn't seem to depend on changing state/props,
    // but including it defensively.
  }, [processedImageData, step, handleRetake]);

  const handleNext = () => {
    if (step === 2) {
      // If we're moving from capture to processing, ensure the image is in the context
      if (scanData.originalImage) {
        setProcessedImageData(scanData.originalImage);
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    // No permitir retroceder del paso 4 si no es para volver a capturar
    if (step === 4 || step === 5) {
      return;
    }
    setStep((prev) => prev - 1);
  };

  const handleImageCapture = (imageFile: File) => {
    // Prevent duplicate processing of the same image
    if (processingImage.current) {
      if (DEBUG) {
        logger.warn('Ignoring duplicate image capture request - processing already in progress');
      }
      return;
    }
    
    // Generate a unique ID for this image
    const imageId = `image-${Date.now()}`;
    processedImageId.current = imageId;
    processingImage.current = true;
    
    if (DEBUG) {
      logger.log(`Starting image processing for new capture: ${imageId}`);
    }
    
    // Convertir la imagen capturada a una URL de datos (data URL)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Only update the state if this is still the current image being processed
      if (processedImageId.current === imageId) {
        // Update both the local state and the ImageContext
        setScanData((prev) => ({
          ...prev,
          originalImage: dataUrl,
        }));
        
        // Set the image data in the ImageContext
        setProcessedImageData(dataUrl);
        
        // Move to the next step
        setStep(3);
      } else if (DEBUG) {
        logger.warn(`Ignoring stale image processing result for ${imageId}`);
      }
      
      // Clear the processing flag
      processingImage.current = false;
    };
    
    reader.onerror = () => {
      if (DEBUG) {
        logger.error('Error reading image file');
      }
      processingImage.current = false;
    };
    
    reader.readAsDataURL(imageFile);
  };

  const _handleProcessingComplete = (data: ProcessingResult) => {
    setScanData((prev) => ({
      ...prev,
      processedImage: data.processedImage,
      qrData: data.qrData,
      answers: data.answers,
      isDuplicate: data.isDuplicate,
      duplicateInfo: data.duplicateInfo,
    }));
    
    // Move to results step
    setStep(4);
  };

  const handleResultsSaved = (resultadoId: string) => {
    setScanData((prev) => ({
      ...prev,
      resultadoId,
    }));
    setStep(5);
  };

  const handleReset = () => {
    // Reset all state for a new scan
    processingImage.current = false;
    processedImageId.current = null;
    setScanData({});
    setStep(1);
  };

  const handleClose = () => {
    // Reset everything when closing the wizard
    handleReset();
    onClose();
  };

  // Título dinámico según el paso actual
  const getTitleByStep = () => {
    switch (step) {
      case 1: return "Instrucciones";
      case 2: return "Captura del Examen";
      case 3: return "Procesando Imagen";
      case 4: return "Resultados del Escaneo";
      case 5: return "Examen Guardado";
      default: return "Asistente de Calificación";
    }
  };

  return (
    <>
      <DialogTitle>{getTitleByStep()}</DialogTitle>
      <DialogDescription className="sr-only">
        Asistente para calificar exámenes escaneados
      </DialogDescription>
      <div className="flex-1 overflow-y-auto">
        {step === 1 && <Instructions onNext={handleNext} />}
        {step === 2 && (
          <ImageCapture
            onCapture={handleImageCapture}
            capturedImage={scanData.originalImage}
            onNext={handleNext}
            onRetake={handleRetake}
          />
        )}
        {step === 3 && (
          <Processing />
        )}
        {step === 4 && (
          <>
            {DEBUG && (
              (() => {
                logger.log('Rendering Results component with:', {
                  processedImageType: typeof scanData.processedImage,
                  processedImage: scanData.processedImage ? `${scanData.processedImage.substring(0, 50)}...` : null,
                  originalImageType: typeof scanData.originalImage,
                  originalImage: scanData.originalImage ? `${scanData.originalImage.substring(0, 50)}...` : null,
                  areImagesEqual: scanData.processedImage === scanData.originalImage
                });
                return null;
              })()
            )}
            <Results
              qrData={scanData.qrData || null}
              answers={scanData.answers || []}
              processedImage={scanData.processedImage || null}
              originalImage={scanData.originalImage || null}
              onPrevious={handleRetake}
              onComplete={handleClose}
              onContinue={handleReset}
              onSaved={handleResultsSaved}
            />
          </>
        )}
        {step === 5 && (
          <Confirmation
            onScanAnother={handleReset}
            onFinish={handleClose}
          />
        )}
      </div>

      {step !== 4 && step !== 5 && (
        <div className="flex justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
          >
            {step === 1 ? 'Cerrar' : 'Atrás'}
          </Button>
        </div>
      )}
    </>
  );
}

export function ScanWizard({ isOpen, onClose }: ScanWizardProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <ImageProvider>
          <ScanWizardContent onClose={onClose} />
        </ImageProvider>
      </DialogContent>
    </Dialog>
  );
} 