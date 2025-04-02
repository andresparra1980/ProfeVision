import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ConfirmationProps {
  onScanAnother: () => void;
  onFinish: () => void;
}

export function Confirmation({ onScanAnother, onFinish }: ConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle className="h-24 w-24 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-green-700">¡Examen guardado correctamente!</h2>
        <p className="text-gray-600 mt-2">
          Los resultados del examen han sido registrados en el sistema.
        </p>
      </div>
      
      <div className="flex space-x-6 mt-8">
        <Button 
          variant="outline"
          size="lg"
          onClick={onScanAnother}
          className="text-base px-8"
        >
          Escanear otro examen
        </Button>
        
        <Button 
          variant="default"
          size="lg"
          onClick={onFinish}
          className="text-base px-8 bg-primary"
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
} 