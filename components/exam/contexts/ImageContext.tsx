"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { QRValidation, FinalOutput } from '../types';

// Define the context type
interface ImageContextType {
  processedImageData: string | null;
  qrValidation: QRValidation;
  setProcessedImageData: (_data: string | null) => void;
  clearImageData: () => void;
  setQrValidation: (_validation: QRValidation) => void;
  setFinalOutput: (_output: FinalOutput) => void;
  finalOutput: FinalOutput | null;
  onProcessingComplete: (() => void) | null;
  setOnProcessingComplete: (_callback: (() => void) | null) => void;
}

// Create the context with default values
const ImageContext = createContext<ImageContextType>({
  processedImageData: null,
  qrValidation: { validated: false, data: null },
  setProcessedImageData: () => {},
  clearImageData: () => {},
  setQrValidation: () => {},
  setFinalOutput: () => {},
  finalOutput: null,
  onProcessingComplete: null,
  setOnProcessingComplete: () => {}
});

// Provider component
export function ImageProvider({ children }: { children: ReactNode }) {
  const [processedImageData, setProcessedImageData] = useState<string | null>(null);
  const [qrValidation, setQrValidation] = useState<QRValidation>({ validated: false, data: null });
  const [finalOutput, setFinalOutput] = useState<FinalOutput | null>(null);
  const [onProcessingComplete, setOnProcessingComplete] = useState<(() => void) | null>(null);

  const clearImageData = () => {
    setProcessedImageData(null);
    setQrValidation({ validated: false, data: null });
    setFinalOutput(null);
  };

  return (
    <ImageContext.Provider
      value={{
        processedImageData,
        qrValidation,
        setProcessedImageData,
        clearImageData,
        setQrValidation,
        setFinalOutput,
        finalOutput,
        onProcessingComplete,
        setOnProcessingComplete
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

// Custom hook to use the context
export function useImageContext() {
  const context = useContext(ImageContext);
  
  if (context === undefined) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  
  return context;
} 