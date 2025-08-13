import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, RotateCcw } from "lucide-react";
import { useTranslations } from 'next-intl';
import Image from "next/image";

interface ImageCaptureProps {
  onCapture: (_file: File) => void;
  capturedImage?: string;
  onNext: () => void;
  onRetake: () => void;
}

export function ImageCapture({ onCapture, capturedImage, onNext, onRetake }: ImageCaptureProps) {
  const t = useTranslations('wizard-step-image-capture');
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
      <h2 className="text-2xl font-bold text-center">{t('title')}</h2>
      
      {!capturedImage ? (
        <>
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Camera className="w-16 h-16 text-gray-400" />
              <div className="text-gray-500">
                <p className="mb-2">{t('capture.instruction')}</p>
                <p className="text-sm">{t('capture.subInstruction')}</p>
              </div>
              <Button 
                onClick={triggerFileInput}
                className="mt-4 bg-primary flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {t('capture.button')}
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
                {t('capture.description')}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">{t('suggestions.title')}</h3>
            <ul className="space-y-1 text-blue-700 list-disc pl-5 text-sm">
              <li>{t('suggestions.tips.0')}</li>
              <li>{t('suggestions.tips.1')}</li>
              <li>{t('suggestions.tips.2')}</li>
              <li>{t('suggestions.tips.3')}</li>
              <li>{t('suggestions.tips.4')}</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden aspect-[4/3]">
            <Image 
              src={capturedImage} 
              alt={t('preview.altText')} 
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
              {t('preview.retakeButton')}
            </Button>
            
            <Button 
              onClick={onNext}
              className="bg-primary flex items-center justify-center gap-2"
            >
              {t('preview.continueButton')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 