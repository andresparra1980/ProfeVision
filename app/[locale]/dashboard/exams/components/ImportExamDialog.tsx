"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  
  // Mensajes para cada etapa del procesamiento
  const stageMessages = [
    "Analizando documento...",
    "Extrayendo preguntas con IA...",
    "Identificando opciones de respuesta...",
    "Procesando formato final..."
  ];
  
  // Consejos útiles para mostrar durante la carga
  const processingTips = [
    "Asegúrate de validar antes de guardar el examen que las respuestas correctas que fueron marcadas por la IA son las correctas.",
    "Preferiblemente usa un PDF con las respuestas correctas resaltadas de un color brillante (ej. verde fosforescente) o pon un asterisco (*) al final de la respuesta correcta.",
    "Para mejores resultados, asegúrate que tu documento tenga un formato claro con preguntas numeradas.",
    "Las preguntas con opciones claramente etiquetadas (A, B, C, D) son más fáciles de procesar.",
    "Se obtienen mejores resultados con documentos que tienen un buen contraste y texto nítido.",
    "El sistema puede reconocer varios formatos, pero es ideal si todas las preguntas siguen un patrón uniforme."
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso de subida con etapas
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Crear saltos en el progreso para cada etapa
          if (prev < 25) return Math.min(prev + 2, 25);
          if (prev < 50) return Math.min(prev + 1, 50);
          if (prev < 75) return Math.min(prev + 0.5, 75);
          return Math.min(prev + 0.2, 90);
        });
      }, 200);

      const response = await fetch('/api/import-exam', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar el archivo');
      }

      const result = await response.json();
      setProcessedData(result);
      toast.success(`Examen procesado exitosamente: ${result.total_preguntas} preguntas encontradas`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al procesar el archivo');
    } finally {
      setIsUploading(false);
    }
  }, []);

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
    localStorage.setItem(`examImport_${importId}`, JSON.stringify(processedData));
    
    // Llamar callback con el ID de importación
    onImportSuccess({ 
      ...processedData, 
      importId 
    });

    // Cerrar el diálogo y restablecer estado
    onOpenChange(false);
    setProcessedData(null);
    setError(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setProcessedData(null);
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <Dialog open={_open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Examen</DialogTitle>
          <DialogDescription>
            Sube un archivo PDF, DOC o DOCX con preguntas de examen para procesarlo automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!processedData && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? 'Suelta el archivo aquí...'
                      : isUploading
                      ? 'Procesando archivo...'
                      : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Archivos soportados: PDF, DOC, DOCX (máx. 10MB)
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
                Tiempo estimado: aproximadamente {Math.round(estimatedSeconds * (1 - uploadProgress/100))} segundos restantes
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processedData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Examen Procesado
                  </CardTitle>
                  <Badge variant="secondary">
                    {processedData.total_preguntas} preguntas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  Se han detectado las siguientes preguntas:
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {processedData.preguntas.slice(0, 3).map((pregunta, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="font-medium">
                        {pregunta.numero}. {pregunta.pregunta}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Opciones: {Object.keys(pregunta.opciones).length} | 
                        Respuesta correcta: {pregunta.respuesta_correcta || 'No detectada'}
                      </div>
                    </div>
                  ))}
                  {processedData.preguntas.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      ... y {processedData.preguntas.length - 3} preguntas más
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {processedData && (
            <Button onClick={handleImport}>
              <FileText className="h-4 w-4 mr-2" />
              Importar Examen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
