import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, RotateCcw } from "lucide-react";
import Image from "next/image";

interface ImageCaptureProps {
  onCapture: (_file: File) => void;
  capturedImage?: string;
  onNext: () => void;
  onRetake: () => void;
}

export function ImageCapture({ onCapture, capturedImage, onNext, onRetake }: ImageCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      onCapture(file);
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-center">Captura del Examen</h2>
      
      {!capturedImage ? (
        <>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Camera className="w-16 h-16 text-gray-400" />
              <div className="text-gray-500">
                <p className="mb-2">Toma una foto clara del examen completo</p>
                <p className="text-sm">Asegúrate de que todas las esquinas sean visibles</p>
              </div>
              <Button 
                onClick={triggerFileInput}
                className="mt-4 bg-primary flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Tomar Foto
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-4">
                Al hacer clic en &quot;Tomar Foto&quot;, se abrirá la cámara de tu dispositivo
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Sugerencias para una mejor captura</h3>
            <ul className="space-y-1 text-blue-700 list-disc pl-5 text-sm">
              <li>Buena iluminación, preferiblemente luz natural</li>
              <li>Superficie plana sin sombras</li>
              <li>Toda la hoja visible en el encuadre</li>
              <li>Cámara paralela al documento</li>
              <li>Evita movimientos bruscos</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden aspect-[4/3]">
            <Image 
              src={capturedImage} 
              alt="Examen capturado" 
              className="object-contain mx-auto"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              unoptimized={capturedImage.startsWith('data:')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              variant="outline"
              onClick={onRetake}
              className="flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Volver a capturar
            </Button>
            
            <Button 
              onClick={onNext}
              className="bg-primary flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 