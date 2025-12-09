'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, RotateCcw, Flashlight, FlashlightOff } from "lucide-react";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { toast } from 'sonner';
import { DocumentCapture, type CaptureResult } from '../document-capture';

// Feature flag for experimental auto-capture
const EXPERIMENTAL_AUTO_CAM = process.env.NEXT_PUBLIC_EXPERIMENTAL_AUTO_CAM === 'true';

interface ImageCaptureProps {
  onCapture: (_file: File) => void;
  capturedImage?: string;
  onNext: () => void;
  onRetake: () => void;
}

export function ImageCapture({ onCapture, capturedImage, onNext, onRetake }: ImageCaptureProps) {
  const t = useTranslations('wizard-step-image-capture');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAutoCapture, setShowAutoCapture] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(true); // Default ON for Android
  const [bwEnabled, setBwEnabled] = useState(true); // Default ON - lighter files

  // Load preferences from localStorage
  useEffect(() => {
    const savedTorch = localStorage.getItem('profevision_torch_enabled');
    if (savedTorch !== null) {
      setTorchEnabled(savedTorch === 'true');
    }
    const savedBw = localStorage.getItem('profevision_bw_enabled');
    if (savedBw !== null) {
      setBwEnabled(savedBw === 'true');
    }
  }, []);

  // Toggle torch and persist to localStorage
  const toggleTorch = useCallback(() => {
    setTorchEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('profevision_torch_enabled', String(newValue));
      return newValue;
    });
  }, []);

  // Toggle B/W and persist to localStorage
  const toggleBw = useCallback(() => {
    setBwEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('profevision_bw_enabled', String(newValue));
      return newValue;
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle auto-capture result (converts Blob to File)
  const handleAutoCapture = useCallback((result: CaptureResult) => {
    try {
      const file = new File([result.blob], `exam-${result.timestamp}.jpg`, {
        type: 'image/jpeg',
        lastModified: result.timestamp,
      });
      setShowAutoCapture(false);
      onCapture(file);
    } catch (err) {
      console.error('Error creating file from blob:', err);
      // Fallback: create File without lastModified (Safari compatibility)
      const file = new File([result.blob], `exam-${result.timestamp}.jpg`, {
        type: 'image/jpeg',
      });
      setShowAutoCapture(false);
      onCapture(file);
    }
  }, [onCapture]);

  const handleAutoCaptureError = useCallback((error: Error) => {
    console.error('Auto capture error:', error);
    toast.error(error.message);
    setShowAutoCapture(false);
  }, []);

  const handleAutoCaptureCancel = useCallback(() => {
    setShowAutoCapture(false);
  }, []);

  // Start auto-capture mode
  const startAutoCapture = () => {
    setShowAutoCapture(true);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Title only shown when NOT in auto-capture mode (header already has it) */}
      {!(EXPERIMENTAL_AUTO_CAM && showAutoCapture) && (
        <h2 className="text-2xl font-bold text-center">{t('title')}</h2>
      )}
      
      {!capturedImage ? (
        <>
          {/* Auto-capture mode (experimental) */}
          {EXPERIMENTAL_AUTO_CAM && showAutoCapture ? (
            <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              <DocumentCapture
                onCapture={handleAutoCapture}
                onError={handleAutoCaptureError}
                onCancel={handleAutoCaptureCancel}
                showManualCapture={true}
                torchEnabled={torchEnabled}
                bwEnabled={bwEnabled}
              />
            </div>
          ) : (
            <>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <div className="text-gray-500 text-sm">
                    <p className="mb-1">{t('capture.instruction')}</p>
                    <p className="text-xs">{t('capture.subInstruction')}</p>
                  </div>
                  
                  {EXPERIMENTAL_AUTO_CAM ? (
                    <div className="flex flex-col items-center gap-3 mt-2">
                      {/* Toggles row */}
                      <div className="flex items-center gap-2">
                        {/* Flash toggle */}
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          {torchEnabled ? (
                            <Flashlight className="w-4 h-4 text-accent" />
                          ) : (
                            <FlashlightOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`text-xs ${torchEnabled ? 'text-accent' : 'text-muted-foreground'}`}>
                            Flash
                          </span>
                        </button>
                        
                        {/* B/W toggle */}
                        <button
                          type="button"
                          onClick={toggleBw}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <span className={`text-xs ${bwEnabled ? 'text-accent' : 'text-muted-foreground'}`}>
                            B/W
                          </span>
                        </button>
                      </div>
                      
                      <Button 
                        onClick={startAutoCapture}
                        className="bg-primary flex items-center gap-2 px-6 py-3 text-base font-bold"
                        size="lg"
                      >
                        <Camera className="w-5 h-5" />
                        {t('capture.button')}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={triggerFileInput}
                      className="mt-2 bg-primary flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {t('capture.button')}
                    </Button>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
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
          )}
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
