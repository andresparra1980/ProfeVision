'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, RotateCcw } from "lucide-react";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { DocumentCapture, type CaptureResult } from '../document-capture';
import { supabase } from '@/lib/supabase/client';

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
  const [_isLoading, setIsLoading] = useState(false);
  const [showAutoCapture, setShowAutoCapture] = useState(false);
  const [userExamIds, setUserExamIds] = useState<Set<string>>(new Set());

  // Fetch user's exam IDs for QR validation
  useEffect(() => {
    if (!EXPERIMENTAL_AUTO_CAM) return;
    
    async function fetchUserExamIds() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        
        const { data, error } = await supabase
          .from('examenes')
          .select('id')
          .eq('user_id', session.user.id);
        
        if (error) {
          console.error('Error fetching exam IDs:', error);
          return;
        }
        
        if (data) {
          setUserExamIds(new Set(data.map((e: { id: string }) => e.id)));
          console.log('[ImageCapture] Loaded', data.length, 'exam IDs for validation');
        }
      } catch (err) {
        console.error('Error fetching exam IDs:', err);
      }
    }
    
    fetchUserExamIds();
  }, []);

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
    // Show error in UI for mobile debugging
    alert(`Capture error: ${error.message}`);
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
                userExamIds={userExamIds}
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
                    <Button 
                      onClick={startAutoCapture}
                      className="mt-2 bg-primary flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {t('capture.button')}
                    </Button>
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
