import { Button } from "@/components/ui/button";

interface InstructionsProps {
  onNext: () => void;
}

export function Instructions({ onNext }: InstructionsProps) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-center">Asistente de Calificación</h2>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">Instrucciones</h3>
        <p className="text-amber-700 mb-4">
          En este asistente de calificación de exámenes vas a poder:
        </p>
        <ul className="space-y-2 text-amber-700 list-disc pl-5">
          <li>Escanear con la cámara de tu celular uno por uno de manera rápida los exámenes</li>
          <li>Validar que la detección fue correcta</li>
          <li>Reescanear si es necesario</li>
          <li>Verificar visualmente si el sistema no detecta alguna pregunta y marcarla manualmente si deseas</li>
        </ul>
      </div>
      
      <Button 
        onClick={onNext} 
        className="w-full bg-primary"
      >
        Continuar
      </Button>
    </div>
  );
} 