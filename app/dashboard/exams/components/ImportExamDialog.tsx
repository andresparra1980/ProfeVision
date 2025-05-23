"use client";

import { useState, useCallback } from "react";
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setProcessedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
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
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
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
