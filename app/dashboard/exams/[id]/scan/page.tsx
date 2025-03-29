"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExamScanner } from '@/components/exam/exam-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// Tipos para los datos del OMR
interface OMRAnswer {
  number: number;
  value: string;
  confidence: number;
  num_options: number;
}

interface OMRResult {
  success: boolean;
  qr_data: string;
  total_questions: number;
  answered_questions: number;
  answers: OMRAnswer[];
}

export default function ExamScanPage() {
  const params = useParams();
  const examId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [scanResult, setScanResult] = useState<OMRResult | null>(null);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Obtener detalles del examen
    const fetchExamDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching exam with ID: ${examId}`);
        
        // Usar el endpoint simplificado para pruebas en lugar del endpoint normal
        const response = await fetch(`/api/exams/simple-details?id=${examId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar el examen');
        }
        
        const examData = await response.json();
        console.log('Examen cargado (desde API simplificada):', examData);
        
        setExam(examData);
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError('No se pudieron cargar los detalles del examen.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (examId) {
      fetchExamDetails();
    } else {
      setError('ID de examen no válido');
      setIsLoading(false);
    }
  }, [examId]);
  
  // Manejar cuando se completa un escaneo
  const handleScanComplete = (result: OMRResult, imageUrl: string) => {
    console.log('Scan completed with result:', result);
    setScanResult(result);
    setScanImageUrl(imageUrl);
  };
  
  // Reiniciar el escaneo
  const handleReset = () => {
    setScanResult(null);
    setScanImageUrl(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span>Cargando detalles del examen...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Escaneo de Examen</h1>
        <p className="text-muted-foreground">
          {exam?.titulo} - {exam?.materia?.nombre}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Captura y Procesamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamScanner 
                examId={examId} 
                onScanComplete={handleScanComplete}
                allowMultipleScans={true}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resultados del Escaneo</CardTitle>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <AlertCircle className="mb-2 h-8 w-8" />
                  <h3 className="text-lg font-medium">Sin resultados</h3>
                  <p className="mt-1">
                    Escanea una hoja de respuestas para ver los resultados del procesamiento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Estado del procesamiento</h3>
                    {scanResult.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="mr-1 h-5 w-5" />
                        <span>Exitoso</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="mr-1 h-5 w-5" />
                        <span>Error</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <Tabs defaultValue="answers">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="answers">Respuestas</TabsTrigger>
                      <TabsTrigger value="summary">Resumen</TabsTrigger>
                      <TabsTrigger value="image">Imagen</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="answers" className="space-y-4">
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {scanResult.answers.map((answer) => (
                          <div 
                            key={answer.number} 
                            className="flex flex-col items-center rounded-md border p-2 text-center"
                          >
                            <div className="text-xs text-muted-foreground">
                              Pregunta {answer.number}
                            </div>
                            <div className="text-xl font-bold">{answer.value}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(answer.confidence * 100)}% conf.
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md border p-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            Total Preguntas
                          </div>
                          <div className="mt-1 text-2xl font-bold">
                            {scanResult.total_questions}
                          </div>
                        </div>
                        <div className="rounded-md border p-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            Respondidas
                          </div>
                          <div className="mt-1 text-2xl font-bold">
                            {scanResult.answered_questions}
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-md border p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          Completitud
                        </div>
                        <div className="mt-1 text-2xl font-bold">
                          {Math.round((scanResult.answered_questions / scanResult.total_questions) * 100)}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: `${Math.round((scanResult.answered_questions / scanResult.total_questions) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {scanResult.qr_data && (
                        <div className="rounded-md border p-4">
                          <div className="text-sm font-medium text-muted-foreground">
                            Datos QR detectados
                          </div>
                          <div className="mt-1 break-all text-sm">
                            {scanResult.qr_data}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="image">
                      {scanImageUrl && (
                        <div className="mt-2 overflow-hidden rounded-md border">
                          <img 
                            src={scanImageUrl} 
                            alt="Escaneo" 
                            className="w-full object-contain"
                          />
                          <div className="p-2 text-center text-xs text-muted-foreground">
                            Imagen procesada por el sistema OMR
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="w-full"
                    >
                      Realizar otro escaneo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 