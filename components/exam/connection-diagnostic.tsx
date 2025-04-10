import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CircleAlert, RefreshCcw, Server, Database, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const DEBUG = process.env.NODE_ENV === 'development';

interface ConnectionDiagnosticProps {
  examId?: string; // Not currently used but kept for future implementation
}

// Define types for service sample data and exam data
interface ExamData {
  id: string;
  title: string;
  created_at: string;
  [key: string]: unknown;
}

interface ServiceSampleData {
  id: string;
  [key: string]: unknown;
}

interface DiagnosticResult {
  timestamp: string;
  environment?: string;
  platform?: string;
  node_version?: string;
  config?: {
    supabase_url: string;
    anon_key: string;
    service_key: string;
    keys_different: string;
  };
  key_analysis?: {
    anon_key_length: number;
    service_key_length: number;
    anon_key_prefix: string;
    service_key_prefix: string;
    are_identical: boolean;
  };
  anon_client_test?: {
    connected: boolean;
    error: string | null;
    data_received: string;
    data_count: number;
  };
  service_client_test?: {
    connected: boolean;
    error: string | null;
    data_received: string;
    data_count: number;
    data_preview: string;
    data_sample?: ServiceSampleData[];
  };
  specific_exam_test?: {
    exam_id: string;
    found: boolean;
    error: string | null;
    exam_data?: ExamData;
  };
  status?: {
    overall: string;
    anonymous_access: string;
    service_access: string;
    specific_exam_found: string;
  };
  recommendations?: string[];
  error?: string;
  message?: string;
}

export default function ConnectionDiagnostic(_props: ConnectionDiagnosticProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const runDiagnostic = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = '/api/supabase-diagnostic';
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('Ejecutando diagnóstico desde:', url);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('Resultado del diagnóstico:', data);
      }
      setDiagnosticResult(data);
    } catch (err) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.error('Error al ejecutar diagnóstico:', err);
      }
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fixEnvironmentVariables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fix-env');
      
      if (!response.ok) {
        throw new Error(`Error al actualizar variables de entorno: ${response.status}`);
      }
      
      const result = await response.json();
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('Resultado de fix-env:', result);
      }
      
      // Ejecutar diagnóstico nuevamente para ver los cambios
      await runDiagnostic();
      
      return result;
    } catch (err) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.error('Error al corregir variables de entorno:', err);
      }
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ejecutar diagnóstico al cargar el componente
  useEffect(() => {
    runDiagnostic();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'working':
      case 'yes':
        return 'bg-green-500 hover:bg-green-600';
      case 'problematic':
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'failed':
      case 'no':
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Diagnóstico de Conexión</h3>
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            {isLoading ? 'Ejecutando...' : 'Actualizar'}
          </Button>
          
          {diagnosticResult?.key_analysis?.are_identical && (
            <Button 
              onClick={fixEnvironmentVariables} 
              variant="destructive" 
              size="sm" 
              disabled={isLoading}
              className="gap-1"
            >
              <Key className="h-4 w-4" />
              Corregir claves
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error en el diagnóstico</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && !diagnosticResult ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      ) : diagnosticResult ? (
        <>
          {/* Resumen del estado */}
          {diagnosticResult.status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex flex-col items-center bg-muted rounded-md p-3">
                <span className="text-xs text-muted-foreground mb-1">Estado general</span>
                <Badge 
                  className={`${getStatusColor(diagnosticResult.status.overall)} text-white`}
                >
                  {diagnosticResult.status.overall === 'healthy' ? 'Saludable' : 
                   diagnosticResult.status.overall === 'problematic' ? 'Problemático' : 'Error'}
                </Badge>
              </div>
              
              <div className="flex flex-col items-center bg-muted rounded-md p-3">
                <span className="text-xs text-muted-foreground mb-1">Acceso anónimo</span>
                <Badge 
                  className={`${getStatusColor(diagnosticResult.status.anonymous_access)} text-white`}
                >
                  {diagnosticResult.status.anonymous_access === 'working' ? 'Funcionando' : 'Fallido'}
                </Badge>
              </div>
              
              <div className="flex flex-col items-center bg-muted rounded-md p-3">
                <span className="text-xs text-muted-foreground mb-1">Acceso de servicio</span>
                <Badge 
                  className={`${getStatusColor(diagnosticResult.status.service_access)} text-white`}
                >
                  {diagnosticResult.status.service_access === 'working' ? 'Funcionando' : 'Fallido'}
                </Badge>
              </div>
              
              <div className="flex flex-col items-center bg-muted rounded-md p-3">
                <span className="text-xs text-muted-foreground mb-1">Examen encontrado</span>
                <Badge 
                  className={`${getStatusColor(diagnosticResult.status.specific_exam_found)} text-white`}
                >
                  {diagnosticResult.status.specific_exam_found === 'yes' ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
          )}
          
          {/* Recomendaciones */}
          {diagnosticResult.recommendations && diagnosticResult.recommendations.length > 0 && (
            <Alert className={diagnosticResult.status?.overall === 'healthy' ? 'bg-green-50' : 'bg-yellow-50'}>
              <AlertTitle>Recomendaciones</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {diagnosticResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Detalles completos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Configuración */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-4 w-4" /> Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Entorno</span>
                      <p>{diagnosticResult.environment || 'No disponible'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Plataforma</span>
                      <p>{diagnosticResult.platform || 'No disponible'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-2 rounded-md">
                    <span className="text-xs text-muted-foreground">URL de Supabase</span>
                    <p>{diagnosticResult.config?.supabase_url || 'No configurada'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Clave anónima</span>
                      <p>{diagnosticResult.config?.anon_key || 'No configurada'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Clave de servicio</span>
                      <p>{diagnosticResult.config?.service_key || 'No configurada'}</p>
                    </div>
                  </div>
                  
                  {diagnosticResult.key_analysis && (
                    <div className="bg-muted p-2 rounded-md">
                      <span className="text-xs text-muted-foreground">Análisis de claves</span>
                      <p className={diagnosticResult.key_analysis.are_identical ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                        {diagnosticResult.key_analysis.are_identical 
                          ? 'Las claves son idénticas - Esto es un problema'
                          : 'Las claves son diferentes - Correcto'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Pruebas de Conexión */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" /> Pruebas de Conexión
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-3">
                  {/* Prueba anónima */}
                  <div className="bg-muted p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Cliente anónimo</span>
                      <Badge 
                        className={`${diagnosticResult.anon_client_test?.connected 
                          ? 'bg-green-500' 
                          : 'bg-red-500'} text-white`}
                      >
                        {diagnosticResult.anon_client_test?.connected 
                          ? 'Conectado' 
                          : 'Error'}
                      </Badge>
                    </div>
                    {diagnosticResult.anon_client_test?.error ? (
                      <p className="text-red-500 text-xs">{diagnosticResult.anon_client_test.error}</p>
                    ) : (
                      <p>Datos recibidos: {diagnosticResult.anon_client_test?.data_count || 0} registros</p>
                    )}
                  </div>
                  
                  {/* Prueba servicio */}
                  <div className="bg-muted p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Cliente de servicio</span>
                      <Badge 
                        className={`${diagnosticResult.service_client_test?.connected 
                          ? 'bg-green-500' 
                          : 'bg-red-500'} text-white`}
                      >
                        {diagnosticResult.service_client_test?.connected 
                          ? 'Conectado' 
                          : 'Error'}
                      </Badge>
                    </div>
                    {diagnosticResult.service_client_test?.error ? (
                      <p className="text-red-500 text-xs">{diagnosticResult.service_client_test.error}</p>
                    ) : (
                      <p>Datos recibidos: {diagnosticResult.service_client_test?.data_count || 0} registros</p>
                    )}
                    
                    {/* Muestra de datos */}
                    {diagnosticResult.service_client_test?.data_sample && 
                      diagnosticResult.service_client_test.data_sample.length > 0 && (
                      <div className="mt-2 border rounded-sm p-1 bg-background text-xs">
                        <p className="font-mono">
                          {JSON.stringify(diagnosticResult.service_client_test.data_sample[0], null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Prueba examen específico */}
                  {diagnosticResult.specific_exam_test && (
                    <div className="bg-muted p-2 rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          Examen específico
                          <span className="ml-1 text-[10px] opacity-70">
                            ({diagnosticResult.specific_exam_test.exam_id})
                          </span>
                        </span>
                        <Badge 
                          className={`${diagnosticResult.specific_exam_test.found 
                            ? 'bg-green-500' 
                            : 'bg-red-500'} text-white`}
                        >
                          {diagnosticResult.specific_exam_test.found 
                            ? 'Encontrado' 
                            : 'No encontrado'}
                        </Badge>
                      </div>
                      
                      {diagnosticResult.specific_exam_test.error ? (
                        <p className="text-red-500 text-xs">{diagnosticResult.specific_exam_test.error}</p>
                      ) : diagnosticResult.specific_exam_test.exam_data ? (
                        <div className="mt-1 text-xs">
                          <p><strong>Título:</strong> {diagnosticResult.specific_exam_test.exam_data.title}</p>
                          <p><strong>ID Profesor:</strong> {String(diagnosticResult.specific_exam_test.exam_data.profesor_id || '')}</p>
                          <p><strong>ID Materia:</strong> {String(diagnosticResult.specific_exam_test.exam_data.materia_id || '')}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-xs text-muted-foreground text-right">
            Última actualización: {new Date(diagnosticResult.timestamp).toLocaleString()}
          </div>
        </>
      ) : (
        <div className="py-4 text-center text-muted-foreground">
          No hay datos de diagnóstico disponibles.
        </div>
      )}
    </div>
  );
} 