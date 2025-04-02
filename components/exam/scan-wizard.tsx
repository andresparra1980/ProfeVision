import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Instructions, ImageCapture, Processing, Results, Confirmation } from './wizard-steps';

interface ScanWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanWizard({ isOpen, onClose }: ScanWizardProps) {
  const [step, setStep] = useState(1);
  const [scanData, setScanData] = useState<{
    originalImage?: string;
    processedImage?: string;
    qrData?: any;
    answers?: any[];
    resultadoId?: string;
  }>({});

  const handleNext = () => {
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
    // Convertir la imagen capturada a una URL de datos (data URL)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setScanData((prev) => ({
        ...prev,
        originalImage: dataUrl,
      }));
    };
    reader.readAsDataURL(imageFile);
  };

  const handleProcessingComplete = (data: any) => {
    setScanData((prev) => ({
      ...prev,
      processedImage: data.processedImage,
      qrData: data.qrData,
      answers: data.answers,
    }));
  };

  const resetStep = (targetStep: number) => {
    setStep(targetStep);
    if (targetStep <= 2) {
      // Limpiar imágenes y datos si volvemos a captura
      setScanData({});
    }
  };
  
  // Función para manejar cuando se guarda el resultado
  const handleResultSaved = (resultadoId: string) => {
    setScanData((prev) => ({
      ...prev,
      resultadoId,
    }));
    // Avanzar al paso de confirmación
    setStep(5);
  };

  // Función para completar un escaneo y continuar con otro
  const handleCompleteAndContinue = () => {
    // Resetear al paso 2 (captura) y limpiar datos para el siguiente escaneo
    resetStep(2);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
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
              onRetake={() => setScanData({})}
            />
          )}
          {step === 3 && (
            <Processing
              imageUrl={scanData.originalImage!}
              onComplete={handleProcessingComplete}
              onRetake={() => resetStep(2)}
              onNext={handleNext}
            />
          )}
          {step === 4 && (
            <Results
              qrData={scanData.qrData || null}
              answers={scanData.answers || []}
              processedImage={scanData.processedImage || null}
              originalImage={scanData.originalImage || null}
              onPrevious={() => resetStep(2)} // Si quiere volver atrás desde resultados, mejor ir directo a captura
              onComplete={onClose}
              onContinue={handleCompleteAndContinue}
              onSaved={handleResultSaved}
            />
          )}
          {step === 5 && (
            <Confirmation
              onScanAnother={handleCompleteAndContinue}
              onFinish={onClose}
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
      </DialogContent>
    </Dialog>
  );
} 