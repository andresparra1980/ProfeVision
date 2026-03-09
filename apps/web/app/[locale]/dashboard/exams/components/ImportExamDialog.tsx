"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ImportedQuestion {
  numero: number;
  pregunta: string;
  opciones: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  respuesta_correcta: string | null;
}

interface ImportResult {
  total_preguntas: number;
  preguntas: ImportedQuestion[];
}

interface ImportValidationIssue {
  numero: number;
  optionCount: number;
  message: string;
}

interface ImportExamDialogProps {
  _open: boolean;
  onOpenChange: (_open: boolean) => void;
  onImportSuccess: (_examData: ImportResult & { importId: string }) => void;
}

export default function ImportExamDialog({ 
  _open, 
  onOpenChange, 
  onImportSuccess 
}: ImportExamDialogProps) {
  const t = useTranslations('dashboard.exams.import');
  const locale = useLocale();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidQuestions, setInvalidQuestions] = useState<ImportValidationIssue[]>([]);
  const [processingStage, setProcessingStage] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const [showFormatExample, setShowFormatExample] = useState(false);
  
  // Mensajes para cada etapa del procesamiento
  const stageMessages = [
    t('stages.analyzing'),
    t('stages.extracting'),
    t('stages.identifying'),
    t('stages.processing')
  ];
  
  // Consejos útiles para mostrar durante la carga
  const processingTips = [
    t('tips.validateAnswers'),
    t('tips.highlightAnswers'),
    t('tips.clearFormat'),
    t('tips.labeledOptions'),
    t('tips.goodContrast'),
    t('tips.uniformPattern')
  ];

  // Efecto para rotar los consejos cada 5 segundos durante la carga
  useEffect(() => {
    let tipRotationInterval: NodeJS.Timeout;
    
    if (isUploading) {
      // Estimar el tiempo basado en el tipo de archivo
      const estimatedTime = 45; // Tiempo base en segundos
      setEstimatedSeconds(estimatedTime);
      
      // Configurar intervalo para rotar consejos
      tipRotationInterval = setInterval(() => {
        setTipIndex(prevIndex => (prevIndex + 1) % processingTips.length);
      }, 5000);
      
      // Configurar intervalo para avanzar las etapas
      const stageInterval = setInterval(() => {
        setProcessingStage(prevStage => {
          const nextStage = prevStage + 1;
          return nextStage < stageMessages.length ? nextStage : prevStage;
        });
      }, estimatedTime * 250); // Distribuir las etapas a lo largo del tiempo estimado
      
      return () => {
        clearInterval(tipRotationInterval);
        clearInterval(stageInterval);
      };
    }
    
    return () => {
      if (tipRotationInterval) clearInterval(tipRotationInterval);
    };
  }, [isUploading, processingTips.length, stageMessages.length]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setInvalidQuestions([]);
    setProcessedData(null);
    setProcessingStage(0);
    setTipIndex(0);
    
    // Estimar tiempo basado en el tipo de archivo
    const fileType = file.type;
    const fileSize = file.size / (1024 * 1024); // tamaño en MB
    
    // Ajustar tiempo estimado basado en tipo y tamaño
    const baseTime = fileType.includes('pdf') ? 50 : 40; // PDF suele tomar más tiempo
    const sizeMultiplier = Math.min(fileSize * 2, 10); // Máximo 10 segundos extra por tamaño
    setEstimatedSeconds(Math.round(baseTime + sizeMultiplier));

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso de subida con etapas
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Crear saltos en el progreso para cada etapa
          if (prev < 25) return Math.min(prev + 2, 25);
          if (prev < 50) return Math.min(prev + 1, 50);
          if (prev < 75) return Math.min(prev + 0.5, 75);
          return Math.min(prev + 0.2, 90);
        });
      }, 200);

      const response = await fetch(`/api/import-exam?locale=${locale}`, {
        method: 'POST',
        headers: {
          'x-next-intl-locale': locale,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setInvalidQuestions(Array.isArray(errorData.invalidQuestions) ? errorData.invalidQuestions : []);

        if (response.status === 400 && Array.isArray(errorData.invalidQuestions)) {
          setError(errorData.message || t('errors.processingFile'));
          return;
        }

        throw new Error(errorData.message || t('errors.processingFile'));
      }

      const result = await response.json();
      setInvalidQuestions([]);
      setProcessedData(result);
      toast.success(t('success.examProcessed', { count: result.total_preguntas }));
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : t('errors.unknown'));
      toast.error(error instanceof Error ? error.message : t('errors.processingFile'));
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress(100);
      setIsUploading(false);
    }
  }, [locale, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleImport = () => {
    if (!processedData) return;

    // Guardar datos en localStorage en lugar de pasar por URL
    const importId = `import_${Date.now()}`;
    console.log('[IMPORT DIALOG] Saving import data to localStorage', {
      importId,
      key: `examImport_${importId}`,
      data: processedData
    });
    localStorage.setItem(`examImport_${importId}`, JSON.stringify(processedData));

    console.log('[IMPORT DIALOG] Calling onImportSuccess with importId:', importId);
    // Llamar callback con el ID de importación
    onImportSuccess({
      ...processedData,
      importId
    });

    // Cerrar el diálogo y restablecer estado
    onOpenChange(false);
    setProcessedData(null);
    setError(null);
    setInvalidQuestions([]);
    setUploadProgress(0);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setProcessedData(null);
    setError(null);
    setInvalidQuestions([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <Dialog open={_open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('title')}
            </DialogTitle>
            <button
              onClick={() => setShowFormatExample(!showFormatExample)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title={t('formatExample.toggle')}
            >
              <HelpCircle className="h-4 w-4" />
              <span>{t('formatExample.button')}</span>
            </button>
          </div>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Format Example Panel */}
        {showFormatExample && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{t('formatExample.title')}</h4>
              <button
                onClick={() => setShowFormatExample(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('formatExample.close')}
              </button>
            </div>
            <div className="relative w-full max-h-64 overflow-auto rounded border bg-white">
              <Image
                src="/images/onboarding/import-example.png"
                alt={t('formatExample.imageAlt')}
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('formatExample.caption')}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!processedData && !isUploading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{t('requirements.title')}</span>{' '}
                {t('requirements.optionRange', { min: 2, max: 4 })}
              </AlertDescription>
            </Alert>
          )}

          {!processedData && !isUploading && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-300 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? t('upload.dragActive')
                      : isUploading
                      ? t('upload.processing')
                      : t('upload.dragDrop')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('upload.supportedFiles')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              {/* Barra de progreso con etapa actual */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stageMessages[processingStage]}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
              
              {/* Indicadores de etapas */}
              <div className="flex justify-between px-1">
                {stageMessages.map((_, index) => (
                  <div 
                    key={index} 
                    className={`relative flex h-2 w-2 rounded-full ${index <= processingStage ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    {index <= processingStage && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Tiempo estimado */}
              <div className="text-xs text-gray-500 text-center">
                {t('upload.estimatedTime', { seconds: Math.round(estimatedSeconds * (1 - uploadProgress/100)) })}
              </div>
              
              {/* Consejos rotativos */}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {processingTips[tipIndex]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{error}</p>
                  {invalidQuestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium">{t('errors.invalidQuestionsTitle')}</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {invalidQuestions.map((question) => (
                          <li key={`invalid-question-${question.numero}`}>
                            {question.message}
                          </li>
                        ))}
                      </ul>
                      <p>{t('errors.invalidQuestionsHelp')}</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {processedData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {t('success.examProcessedTitle')}
                  </CardTitle>
                  <Badge variant="secondary">
                    {t('success.questionsCount', { count: processedData.total_preguntas })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  {t('success.questionsDetected')}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {processedData.preguntas.slice(0, 3).map((pregunta, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="font-medium">
                        {pregunta.numero}. {pregunta.pregunta}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {t('success.optionsLabel')}: {Object.keys(pregunta.opciones).length} | 
                        {t('success.correctAnswerLabel')}: {pregunta.respuesta_correcta || t('success.notDetected')}
                      </div>
                    </div>
                  ))}
                  {processedData.preguntas.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      {t('success.moreQuestions', { count: processedData.preguntas.length - 3 })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('actions.cancel')}
          </Button>
          {processedData && (
            <Button onClick={handleImport}>
              <FileText className="h-4 w-4 mr-2" />
              {t('actions.import')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
