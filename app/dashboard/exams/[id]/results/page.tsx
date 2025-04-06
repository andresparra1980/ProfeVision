'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Image as ImageIcon, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
}

interface RespuestaEstudiante {
  id: string;
  pregunta_id: string;
  opcion_id: string;
  es_correcta: boolean;
  puntaje_obtenido: number;
  pregunta: {
    orden: number;
    num_opciones: number;
    habilitada: boolean;
  };
  opcion_respuesta: {
    orden: number;
  };
}

interface ResultadoExamen {
  id: string;
  estudiante: Estudiante;
  puntaje_obtenido: number;
  porcentaje: number;
  fecha_calificacion: string;
  respuestas_estudiante: RespuestaEstudiante[];
  examen_escaneado?: {
    archivo_original: string;
    archivo_procesado: string;
    ruta_s3_original: string;
    ruta_s3_procesado: string;
  };
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<any>(null);
  const [resultados, setResultados] = useState<ResultadoExamen[]>([]);

  useEffect(() => {
    fetchExamResults();
  }, []);

  async function fetchExamResults() {
    try {
      setLoading(true);
      const examId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

      console.log('Fetching results for exam:', examId);

      // Obtener detalles del examen
      const { data: examData, error: examError } = await supabase
        .from('examenes')
        .select(`
          *,
          materias(nombre)
        `)
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Error fetching exam:', examError);
        throw examError;
      }

      console.log('Exam data:', examData);

      // Obtener resultados con todas las relaciones en una sola consulta
      const { data: resultsData, error: resultsError } = await supabase
        .from('resultados_examen')
        .select(`
          id,
          estudiante_id,
          puntaje_obtenido,
          porcentaje,
          fecha_calificacion,
          estudiante:estudiantes!inner(
            id,
            nombres,
            apellidos
          ),
          respuestas_estudiante(
            id,
            pregunta_id,
            opcion_id,
            es_correcta,
            puntaje_obtenido,
            pregunta:preguntas!inner(
              id,
              orden,
              habilitada,
              opciones:opciones_respuesta(count)
            ),
            opcion_respuesta:opciones_respuesta(
              id,
              orden
            )
          ),
          examenes_escaneados(
            id,
            archivo_original,
            archivo_procesado,
            ruta_s3_original,
            ruta_s3_procesado
          )
        `)
        .eq('examen_id', examId)
        .order('fecha_calificacion', { ascending: false });

      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        throw resultsError;
      }

      if (!resultsData || resultsData.length === 0) {
        setExamDetails(examData);
        setResultados([]);
        return;
      }

      // Asegurarnos de que los datos coincidan con el tipo ResultadoExamen
      const typedResults: ResultadoExamen[] = resultsData
        .map((result: any): ResultadoExamen | null => {
          if (!result.estudiante) return null;

          const respuestas = Array.isArray(result.respuestas_estudiante) 
            ? result.respuestas_estudiante
                .map((respuesta: any): RespuestaEstudiante | null => {
                  if (!respuesta.pregunta || !respuesta.opcion_respuesta) return null;

                  return {
                    id: respuesta.id,
                    pregunta_id: respuesta.pregunta_id,
                    opcion_id: respuesta.opcion_id,
                    es_correcta: respuesta.es_correcta,
                    puntaje_obtenido: respuesta.puntaje_obtenido,
                    pregunta: {
                      orden: respuesta.pregunta.orden,
                      num_opciones: respuesta.pregunta.opciones?.[0]?.count || 4,
                      habilitada: respuesta.pregunta.habilitada
                    },
                    opcion_respuesta: {
                      orden: respuesta.opcion_respuesta.orden
                    }
                  };
                })
                .filter((r: RespuestaEstudiante | null): r is RespuestaEstudiante => r !== null)
            : [];

          return {
            id: result.id,
            estudiante: {
              id: result.estudiante.id,
              nombres: result.estudiante.nombres,
              apellidos: result.estudiante.apellidos
            },
            puntaje_obtenido: result.puntaje_obtenido,
            porcentaje: result.porcentaje,
            fecha_calificacion: result.fecha_calificacion,
            respuestas_estudiante: respuestas,
            examen_escaneado: result.examenes_escaneados?.[0]
          };
        })
        .filter((resultado: ResultadoExamen | null): resultado is ResultadoExamen => resultado !== null);

      setExamDetails(examData);
      setResultados(typedResults);
    } catch (error) {
      console.error('Error in fetchExamResults:', error);
    } finally {
      setLoading(false);
    }
  }

  // Función para convertir número a letra (1 -> A, 2 -> B, etc.)
  const getLetterFromNumber = (num: number) => {
    return String.fromCharCode(64 + num);
  };

  // Función para obtener el color de la burbuja según la opción
  const getAnswerBubbleStyle = (letter: string) => {
    switch (letter.toUpperCase()) {
      case 'A': return 'bg-blue-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-purple-500';
      case 'E': return 'bg-pink-500';
      case 'F': return 'bg-indigo-500';
      case 'G': return 'bg-red-500';
      case 'H': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard/exams")}
            className="mb-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Exámenes
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{examDetails?.titulo}</h2>
          <p className="text-muted-foreground">
            {examDetails?.materias?.nombre} | Resultados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados del Examen</CardTitle>
          <CardDescription>
            Lista de estudiantes y sus calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay resultados disponibles para este examen
            </div>
          ) : (
            <Accordion type="single" collapsible>
              {resultados.map((resultado) => (
                <AccordionItem key={resultado.id} value={resultado.id}>
                  <AccordionTrigger>
                    <div className="flex flex-col w-full gap-2">
                      <div className="font-medium text-left">
                        {resultado.estudiante.nombres} {resultado.estudiante.apellidos}
                      </div>
                      <div className="flex items-center justify-end gap-4 text-sm">
                        <div>
                          Calificación: {resultado.puntaje_obtenido.toFixed(2)}/{examDetails.puntaje_total}
                        </div>
                        <div className="text-muted-foreground">
                          {resultado.porcentaje.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <Tabs defaultValue="answers" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="answers">Respuestas</TabsTrigger>
                        <TabsTrigger value="original" className="flex items-center gap-2">
                          <ImageIcon className="h-[16px] w-[16px] md:hidden shrink-0" />
                          <span className="hidden md:inline">Imagen Original</span>
                          <span className="md:hidden">Original</span>
                        </TabsTrigger>
                        <TabsTrigger value="processed" className="flex items-center gap-2">
                          <FileImage className="h-[16px] w-[16px] md:hidden shrink-0" />
                          <span className="hidden md:inline">Imagen Procesada</span>
                          <span className="md:hidden">Procesada</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="answers">
                        <div className="pt-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              {resultado.respuestas_estudiante
                                .filter(r => r.pregunta.orden <= 20)
                                .sort((a, b) => a.pregunta.orden - b.pregunta.orden)
                                .map((respuesta) => (
                                  <div 
                                    key={respuesta.id} 
                                    className={`flex items-center`}
                                  >
                                    <span className={`text-sm font-medium min-w-[25px] ${!respuesta.pregunta.habilitada ? 'line-through opacity-40' : ''}`}>
                                      {respuesta.pregunta.orden}.
                                    </span>
                                    <div className={`flex items-center space-x-1 ${!respuesta.pregunta.habilitada ? 'opacity-30' : ''}`}>
                                      {Array.from({ length: respuesta.pregunta.num_opciones || 4 }, (_, i) => i + 1).map((num) => {
                                        const letter = getLetterFromNumber(num);
                                        const isSelected = respuesta.opcion_respuesta.orden === num;
                                        return (
                                          <div 
                                            key={`bubble-${respuesta.id}-${num}`}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                                              ${isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200'}`}
                                          >
                                            {isSelected ? letter : ''}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <span className={`ml-2 text-xs ${respuesta.es_correcta ? 'text-green-600' : 'text-red-600'} ${!respuesta.pregunta.habilitada ? 'opacity-30' : ''}`}>
                                      {respuesta.es_correcta ? '✓' : '✗'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                              {resultado.respuestas_estudiante
                                .filter(r => r.pregunta.orden > 20)
                                .sort((a, b) => a.pregunta.orden - b.pregunta.orden)
                                .map((respuesta) => (
                                  <div 
                                    key={respuesta.id} 
                                    className={`flex items-center`}
                                  >
                                    <span className={`text-sm font-medium min-w-[25px] ${!respuesta.pregunta.habilitada ? 'line-through opacity-40' : ''}`}>
                                      {respuesta.pregunta.orden}.
                                    </span>
                                    <div className={`flex items-center space-x-1 ${!respuesta.pregunta.habilitada ? 'opacity-30' : ''}`}>
                                      {Array.from({ length: respuesta.pregunta.num_opciones || 4 }, (_, i) => i + 1).map((num) => {
                                        const letter = getLetterFromNumber(num);
                                        const isSelected = respuesta.opcion_respuesta.orden === num;
                                        return (
                                          <div 
                                            key={`bubble-${respuesta.id}-${num}`}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                                              ${isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200'}`}
                                          >
                                            {isSelected ? letter : ''}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <span className={`ml-2 text-xs ${respuesta.es_correcta ? 'text-green-600' : 'text-red-600'} ${!respuesta.pregunta.habilitada ? 'opacity-30' : ''}`}>
                                      {respuesta.es_correcta ? '✓' : '✗'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="original">
                        {resultado.examen_escaneado?.ruta_s3_original ? (
                          <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                            <ImageWithSignedUrl
                              path={resultado.examen_escaneado.ruta_s3_original}
                              alt="Imagen original del examen"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No hay imagen original disponible
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="processed">
                        {resultado.examen_escaneado?.ruta_s3_procesado ? (
                          <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                            <ImageWithSignedUrl
                              path={resultado.examen_escaneado.ruta_s3_procesado}
                              alt="Imagen procesada del examen"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No hay imagen procesada disponible
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Agregar el componente ImageWithSignedUrl antes del componente principal
function ImageWithSignedUrl({ path, alt }: { path: string, alt: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Mover la función getStorageUrl dentro del componente
  const getStorageUrl = async (filePath: string | null | undefined) => {
    if (!filePath) return '';
    
    try {
      console.log('Trying to get signed URL for path:', filePath);

      // Usar la ruta exactamente como viene de la base de datos
      const { data, error } = await supabase
        .storage
        .from('examenes-escaneados')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error generating signed URL:', error);
        return '';
      }

      console.log('Generated signed URL:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error constructing storage URL:', error);
      return '';
    }
  };

  useEffect(() => {
    async function fetchSignedUrl() {
      const url = await getStorageUrl(path);
      if (url) {
        setImageUrl(url);
      } else {
        setError(true);
      }
    }

    fetchSignedUrl();
  }, [path]);

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error al cargar la imagen
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-contain"
      onError={() => setError(true)}
    />
  );
} 