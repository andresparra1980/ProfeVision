'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Save, AlertCircle, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import * as XLSX from 'xlsx';
import dynamic from 'next/dynamic';

// Import react-pdf components (but disable due to client-only usage)
// These imports are only referenced in code that is disabled for ESLint

//import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';

// We've replaced the dynamic PDFExportButton with a regular Button component
// to avoid issues with passing JSX elements to a string prop

// Configurar flag de debug para mensajes de consola
const DEBUG = process.env.NODE_ENV === 'development';

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
}

interface OpcionRespuesta {
  id: string;
  orden: number;
  pregunta_id: string;
  es_correcta: boolean;
}

interface RespuestaEstudiante {
  id: string;
  pregunta_id: string;
  opcion_id: string;
  es_correcta: boolean;
  puntaje_obtenido: number;
  pregunta: {
    id: string;
    orden: number;
    num_opciones: number;
    habilitada: boolean;
    opciones_respuesta: OpcionRespuesta[];
  };
  opcion_respuesta: {
    id: string;
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
  imagenBase64?: string;
}

interface GrupoExamen {
  id: string;
  grupo_id: string;
  nombre: string;
}

interface ExamDetails {
  id: string;
  titulo: string;
  estado: string;
  creado_en: string;
  created_at?: string;
  puntaje_total?: number;
  materias?: {
    nombre: string;
  };
  grupo_id?: string;
  grupos?: {
    id: string;
    nombre: string;
  };
  grupos_asignados?: GrupoExamen[];
  [key: string]: unknown;
}

// Constante para las letras de las opciones
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Define interfaces for the Supabase results
interface ExamenGrupoItem {
  id: string;
  grupo_id: string;
  grupos?: {
    id: string;
    nombre: string;
  };
}

interface ResultadoExamenItem {
  id: string;
  estudiante_id: string;
  puntaje_obtenido: number;
  porcentaje: number;
  fecha_calificacion: string;
  estudiante: Estudiante;
  respuestas_estudiante: Record<string, unknown>[];
  examenes_escaneados?: Record<string, unknown>[];
}

// Dynamic import for PDF generator component (client-side only)
const PDFExportButton = dynamic(
  () => import('@/components/exam/pdf-export-button').then(mod => mod.PDFExportButton),
  { 
    ssr: false,
    loading: () => (
      <Button variant="secondary" disabled className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando PDF...
      </Button>
    )
  }
);

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [resultados, setResultados] = useState<ResultadoExamen[]>([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState<Estudiante[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showManualGradeDialog, setShowManualGradeDialog] = useState(false);
  const [selectedResultado, setSelectedResultado] = useState<ResultadoExamen | null>(null);
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);
  const [manualGrade, setManualGrade] = useState<string>('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    respuestaId: string;
    opcionId: string;
    resultadoId: string;
    preguntaOrden: number;
    nuevaLetra: string;
  } | null>(null);
  const [updatingAnswer, setUpdatingAnswer] = useState(false);
  const [verSoloConExamen, setVerSoloConExamen] = useState(false);
  const [totalPreguntas, setTotalPreguntas] = useState<number>(0);
  
  // New state for group selection
  const [showGroupSelectionModal, setShowGroupSelectionModal] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<GrupoExamen[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // New state to track if we're initializing from storage
  const [initializing, setInitializing] = useState(true);

  // Define fetchExamResults with useCallback para usarlo en el useEffect
  const fetchExamResults = useCallback(async (groupIdOverride?: string) => {
    try {
      setLoading(true);
      const examId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
      
      // Usar el groupIdOverride si se proporciona, de lo contrario usar selectedGroupId
      const groupIdToUse = groupIdOverride || selectedGroupId;

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
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
        throw examError;
      }

      setExamDetails(examData);

      // Obtener el número total de preguntas del examen
      const { data: preguntasData, error: preguntasError } = await supabase
        .from('preguntas')
        .select('orden')
        .eq('examen_id', examId)
        .order('orden', { ascending: false })
        .limit(1);

      if (preguntasError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
      } else if (preguntasData && preguntasData.length > 0) {
        // El orden más alto representa el número total de preguntas
        setTotalPreguntas(preguntasData[0].orden);
      }

      // Obtener todas las relaciones con grupos a través de examen_grupo
      const { data: examenGruposData, error: examenGruposError } = await supabase
        .from('examen_grupo')
        .select(`
          id,
          grupo_id,
          grupos(id, nombre)
        `)
        .eq('examen_id', examId);

      if (examenGruposError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
      } else if (examenGruposData && examenGruposData.length > 0) {
        // Transformar los datos de grupos para manejarlos más fácilmente
        const grupos = examenGruposData.map((item: ExamenGrupoItem) => ({
          id: item.id,
          grupo_id: item.grupo_id,
          nombre: item.grupos?.nombre || 'Sin nombre'
        }));
        
        setAvailableGroups(grupos);
        
        // Si hay más de un grupo y no hay grupo seleccionado o se proporcionó un override
        let grupoToUse: GrupoExamen | undefined;
        
        if (groupIdOverride) {
          // Si hay un ID de grupo específico para usar, buscar ese grupo
          grupoToUse = grupos.find((g: GrupoExamen) => g.grupo_id === groupIdOverride);
        } else if (initializing && grupos.length > 0) {
          // Si estamos inicializando, intentar cargar desde localStorage
          try {
            const storedGroupId = localStorage.getItem(`exam_${examId}_selected_group`);
            
            if (storedGroupId) {
              // Verificar que el grupo guardado exista en los grupos disponibles
              const storedGroup = grupos.find((g: GrupoExamen) => g.grupo_id === storedGroupId);
              if (storedGroup) {
                grupoToUse = storedGroup;
              } else {
                // Si el grupo guardado ya no existe, usar el primero
                grupoToUse = grupos[0];
              }
            } else {
              // Si no hay grupo guardado, usar el primero
              grupoToUse = grupos[0];
            }
          } catch (_error) {
            // Si hay un error al acceder a localStorage (ej. en modo privado), usar el primer grupo
            grupoToUse = grupos[0];
          }
          
          // Ya no estamos inicializando
          setInitializing(false);
        } else if (selectedGroupId) {
          // Si hay un grupo seleccionado, usarlo
          grupoToUse = grupos.find((g: GrupoExamen) => g.grupo_id === selectedGroupId);
        } else if (grupos.length > 0) {
          // Si no hay grupo seleccionado, usar el primer grupo por defecto
          grupoToUse = grupos[0];
        }
          
        if (grupoToUse) {
          // Actualizar el ID de grupo seleccionado si es necesario
          if (grupoToUse.grupo_id !== selectedGroupId) {
            setSelectedGroupId(grupoToUse.grupo_id);
            
            // Guardar el grupo seleccionado en localStorage
            try {
              localStorage.setItem(`exam_${examId}_selected_group`, grupoToUse.grupo_id);
            } catch (_error) {
              // Manejar el error silenciosamente
              if (DEBUG) {
                // Registramos el error en un logger en lugar de la consola
              }
            }
          }
          
          // Agregar información del grupo al objeto de detalles del examen
          setExamDetails(prevDetails => prevDetails ? {
            ...prevDetails,
            grupo_id: grupoToUse!.grupo_id,
            grupos: {
              id: grupoToUse!.grupo_id,
              nombre: grupoToUse!.nombre
            },
            grupos_asignados: grupos
          } : null);

          // Obtener todos los estudiantes del grupo
          const { data: estudiantesGrupo, error: estudiantesError } = await supabase
            .from('estudiantes')
            .select('*')
            .in('id', (
              await supabase
                .from('estudiante_grupo')
                .select('estudiante_id')
                .eq('grupo_id', grupoToUse.grupo_id)
            ).data?.map((row: { estudiante_id: string }) => row.estudiante_id) || [])
            .order('apellidos', { ascending: true })
            .order('nombres', { ascending: true });

          if (estudiantesError) {
            if (DEBUG) {
              // Registramos el error en un logger en lugar de la consola
            }
          } else {
            setTodosEstudiantes(estudiantesGrupo || []);
          }
        }
      }

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
            apellidos,
            identificacion
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
              opciones_respuesta(
                id,
                orden,
                es_correcta
              )
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
        .eq('examen_id', examId);

      if (resultsError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
        throw resultsError;
      }

      if (!resultsData || resultsData.length === 0) {
        setResultados([]);
        setLoading(false);
        return;
      }

      // Si hay un grupo seleccionado, filtramos los resultados para ese grupo
      let filteredResults = resultsData;
      if (groupIdToUse) {
        // Obtener los IDs de estudiantes del grupo seleccionado
        const { data: estudiantesDelGrupo } = await supabase
          .from('estudiante_grupo')
          .select('estudiante_id')
          .eq('grupo_id', groupIdToUse);
        
        const estudianteIds = estudiantesDelGrupo?.map((e: { estudiante_id: string }) => e.estudiante_id) || [];
        
        // Filtrar resultados solo para los estudiantes del grupo seleccionado
        filteredResults = resultsData.filter((result: ResultadoExamenItem) => 
          estudianteIds.includes(result.estudiante_id)
        );
      }

      // Asegurarnos de que los datos coincidan con el tipo ResultadoExamen
      const typedResults: ResultadoExamen[] = filteredResults
        .map((result: Record<string, unknown>): ResultadoExamen | null => {
          const estudiante = result.estudiante as Estudiante | undefined;
          if (!estudiante) return null;

          const respuestasEstudiante = result.respuestas_estudiante as Array<Record<string, unknown>> | undefined;
          const respuestas = Array.isArray(respuestasEstudiante) 
            ? respuestasEstudiante
                .map((respuesta): RespuestaEstudiante | null => {
                  const pregunta = respuesta.pregunta as Record<string, unknown> | undefined;
                  const opcionRespuesta = respuesta.opcion_respuesta as Record<string, unknown> | undefined;
                  
                  if (!pregunta || !opcionRespuesta) return null;

                  const opcionesRespuesta = pregunta.opciones_respuesta as OpcionRespuesta[] | undefined;

                  return {
                    id: respuesta.id as string,
                    pregunta_id: respuesta.pregunta_id as string,
                    opcion_id: respuesta.opcion_id as string,
                    es_correcta: respuesta.es_correcta as boolean,
                    puntaje_obtenido: respuesta.puntaje_obtenido as number,
                    pregunta: {
                      id: pregunta.id as string,
                      orden: pregunta.orden as number,
                      num_opciones: opcionesRespuesta?.length || 4,
                      habilitada: pregunta.habilitada as boolean,
                      opciones_respuesta: opcionesRespuesta || []
                    },
                    opcion_respuesta: {
                      id: opcionRespuesta.id as string,
                      orden: opcionRespuesta.orden as number
                    }
                  };
                })
                .filter((r: RespuestaEstudiante | null): r is RespuestaEstudiante => r !== null)
            : [];

          const examenesEscaneados = result.examenes_escaneados as Array<Record<string, unknown>> | undefined;
          const examenEscaneado = examenesEscaneados?.[0];

          return {
            id: result.id as string,
            estudiante: {
              id: estudiante.id,
              nombres: estudiante.nombres,
              apellidos: estudiante.apellidos,
              identificacion: estudiante.identificacion
            },
            puntaje_obtenido: result.puntaje_obtenido as number,
            porcentaje: result.porcentaje as number,
            fecha_calificacion: result.fecha_calificacion as string,
            respuestas_estudiante: respuestas,
            examen_escaneado: examenEscaneado ? {
              archivo_original: examenEscaneado.archivo_original as string,
              archivo_procesado: examenEscaneado.archivo_procesado as string,
              ruta_s3_original: examenEscaneado.ruta_s3_original as string,
              ruta_s3_procesado: examenEscaneado.ruta_s3_procesado as string
            } : undefined
          };
        })
        .filter((resultado: ResultadoExamen | null): resultado is ResultadoExamen => resultado !== null);

      setResultados(typedResults);
    } catch (_error) {
      if (DEBUG) {
        // Registramos el error en un logger en lugar de la consola
      }
      toast({
        title: "Error",
        description: "Error al cargar los resultados del examen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast, selectedGroupId, initializing]);

  useEffect(() => {
    fetchExamResults();
  }, [fetchExamResults]);

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

  // Función para manejar el click en una burbuja
  const handleBubbleClick = async (
    respuesta: RespuestaEstudiante,
    opcionOrden: number,
    resultadoId: string,
    opcionId: string
  ) => {
    // No permitir cambios si la pregunta está deshabilitada
    if (!respuesta.pregunta.habilitada) return;

    // No permitir seleccionar la misma opción
    if (respuesta.opcion_respuesta.orden === opcionOrden) return;

    // Preparar datos para el modal de confirmación
    setPendingUpdate({
      respuestaId: respuesta.id,
      opcionId,
      resultadoId,
      preguntaOrden: respuesta.pregunta.orden,
      nuevaLetra: getLetterFromNumber(opcionOrden)
    });

    // Mostrar el modal de confirmación
    setShowConfirmDialog(true);
  };

  // Función para confirmar y actualizar la respuesta
  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      setUpdatingAnswer(true);

      const response = await fetch(`/api/exams/${params.id}/update-answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respuestaId: pendingUpdate.respuestaId,
          opcionId: pendingUpdate.opcionId,
        }),
      });

      if (!response.ok) {
        const _error = await response.json();
        throw new Error(_error.error || 'Error al actualizar la respuesta');
      }

      const result = await response.json();

      // Actualizar el estado local con la nueva información
      setResultados(prevResultados => {
        const updatedResultados = prevResultados.map(resultado => {
          if (resultado.id === pendingUpdate.resultadoId) {
            const updatedResultado = {
              ...resultado,
              puntaje_obtenido: result.puntajeObtenido,
              porcentaje: result.porcentaje,
              respuestas_estudiante: resultado.respuestas_estudiante.map(respuesta => {
                if (respuesta.id === pendingUpdate.respuestaId) {
                  return {
                    ...respuesta,
                    opcion_id: pendingUpdate.opcionId,
                    es_correcta: result.es_correcta,
                    opcion_respuesta: {
                      ...respuesta.opcion_respuesta,
                      orden: OPTION_LETTERS.indexOf(pendingUpdate.nuevaLetra) + 1
                    }
                  };
                }
                return respuesta;
              })
            };
            
            // Si este resultado es el que está seleccionado actualmente en el modal, actualizarlo también
            if (selectedResultado && selectedResultado.id === resultado.id) {
              setTimeout(() => setSelectedResultado(updatedResultado), 0);
            }
            
            return updatedResultado;
          }
          return resultado;
        });
        
        return updatedResultados;
      });

      toast({
        title: "Respuesta actualizada",
        description: "La calificación ha sido recalculada correctamente.",
      });

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast({
          title: "Error al actualizar",
          description: String(error.message) || "No se pudo actualizar la respuesta",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al actualizar",
          description: "No se pudo actualizar la respuesta",
          variant: "destructive",
        });
      }
    } finally {
      setUpdatingAnswer(false);
      setShowConfirmDialog(false);
      setPendingUpdate(null);
    }
  };

  // Función para mostrar el diálogo de detalles
  const handleShowDetails = async (resultado: ResultadoExamen) => {
    // Load the base64 image if needed and not already loaded
    let resultadoWithImage = resultado;
    if (resultado.examen_escaneado?.ruta_s3_procesado && !resultado.imagenBase64) {
      try {
        const signedUrl = await getStorageUrl(resultado.examen_escaneado.ruta_s3_procesado);
        if (signedUrl) {
          const base64Image = await fetchImageAsBase64(signedUrl);
          if (base64Image) {
            resultadoWithImage = {
              ...resultado,
              imagenBase64: base64Image
            };
          }
        }
      } catch (_error) {
        if (DEBUG) {
          // Log the error
        }
      }
    }
    
    setSelectedResultado(resultadoWithImage);
    setShowDetailsDialog(true);
  };

  // Función para obtener URL firmada
  const getStorageUrl = async (filePath: string | null | undefined) => {
    if (!filePath) return '';
    
    try {
      const { data, error: _error } = await supabase
        .storage
        .from('examenes-escaneados')
        .createSignedUrl(filePath, 3600);

      if (_error) {
        return '';
      }

      return data.signedUrl;
    } catch (_error) {
      return '';
    }
  };

  // Función para convertir imagen a base64
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract only the base64 data part without the prefix
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (_error) {
      if (DEBUG) {
        // Log the error
      }
      return null;
    }
  };

  // Función para cargar imágenes en base64 para todas las resultusos con progreso real
  const loadImagesForPDF = async (updateProgress: (_progress: number) => void): Promise<ResultadoExamen[]> => {
    const resultadosWithImages = [...resultados];
    
    // Calculate total images to track progress
    const imagesToProcess = resultados.filter(r => r.examen_escaneado?.ruta_s3_procesado && !r.imagenBase64).length;
    let processedImages = 0;
    
    // Update initial progress
    updateProgress(0);
    
    // If no images to process, return immediately
    if (imagesToProcess === 0) {
      updateProgress(100);
      return resultadosWithImages;
    }
    
    // Process images in batches to avoid too many parallel requests
    const batchSize = 3;
    for (let i = 0; i < resultadosWithImages.length; i += batchSize) {
      const batch = resultadosWithImages.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (resultado, index) => {
          const actualIndex = i + index;
          if (resultado.examen_escaneado?.ruta_s3_procesado && !resultado.imagenBase64) {
            try {
              const signedUrl = await getStorageUrl(resultado.examen_escaneado.ruta_s3_procesado);
              if (signedUrl) {
                const base64Image = await fetchImageAsBase64(signedUrl);
                if (base64Image) {
                  resultadosWithImages[actualIndex] = {
                    ...resultado,
                    imagenBase64: base64Image
                  };
                }
              }
            } catch (_error) {
              if (DEBUG) {
                // Log the error
              }
            } finally {
              // Increment processed count
              processedImages++;
              // Update progress - calculate percentage
              const progressPercentage = Math.round((processedImages / imagesToProcess) * 100);
              updateProgress(progressPercentage);
            }
          }
        })
      );
    }
    
    return resultadosWithImages;
  };

  // Función para mostrar el diálogo de calificación manual
  const handleShowManualGradeDialog = (estudiante: Estudiante) => {
    setSelectedEstudiante(estudiante);
    setManualGrade('');
    setShowManualGradeDialog(true);
  };

  // Función para guardar la calificación manual
  const handleSaveManualGrade = async () => {
    if (!selectedEstudiante || !manualGrade) return;
    
    try {
      setIsSubmittingGrade(true);
      
      const gradeValue = parseFloat(manualGrade);
      
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        toast({
          title: "Error",
          description: "La calificación debe ser un número entre 0 y 5",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch(`/api/exams/${params.id}/manual-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estudianteId: selectedEstudiante.id,
          puntaje: gradeValue,
        }),
      });

      if (!response.ok) {
        const _error = await response.json();
        throw new Error(_error.error || 'Error al guardar la calificación');
      }
      
      // Refrescar los resultados
      await fetchExamResults();
      
      toast({
        title: "Calificación guardada",
        description: "La calificación ha sido registrada correctamente.",
      });
      
      setShowManualGradeDialog(false);
      
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast({
          title: "Error al guardar",
          description: String(error.message) || "No se pudo guardar la calificación",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar la calificación",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Función para exportar resultados a Excel
  const handleExportToExcel = () => {
    if (!examDetails || resultados.length === 0) {
      toast({
        title: "Error",
        description: "No hay resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Crear datos para exportar
      const dataToExport = resultados.map(resultado => ({
        "Apellidos": resultado.estudiante.apellidos,
        "Nombres": resultado.estudiante.nombres,
        "Identificación": resultado.estudiante.identificacion,
        "Nota": resultado.puntaje_obtenido.toFixed(2),
        "Porcentaje": `${resultado.porcentaje.toFixed(2)}%`,
        "Fecha de Calificación": new Date(resultado.fecha_calificacion).toLocaleDateString()
      }));

      // Agregar estudiantes sin calificación
      todosEstudiantes
        .filter(estudiante => !resultados.some(r => r.estudiante.id === estudiante.id))
        .forEach(estudiante => {
          dataToExport.push({
            "Apellidos": estudiante.apellidos,
            "Nombres": estudiante.nombres,
            "Identificación": estudiante.identificacion,
            "Nota": "No presentado",
            "Porcentaje": "0.00%",
            "Fecha de Calificación": ""
          });
        });
      
      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Preparar los datos del encabezado
      const headerData = [
        [`RESULTADOS: ${examDetails.titulo}`],
        [''],
        ['DETALLES DEL EXAMEN'],
        [`Materia: ${examDetails.materias?.nombre || 'Sin materia'}`],
        [`Puntaje Total: ${examDetails.puntaje_total}`],
        [`Grupo: ${examDetails.grupos?.nombre || 'Sin grupo'}`],
        [`Fecha de Creación: ${examDetails.created_at ? new Date(examDetails.created_at as string).toLocaleDateString() : 'No disponible'}`],
        [''],
        ['ESTADÍSTICAS'],
        [`Estudiantes con examen: ${resultados.length} de ${todosEstudiantes.length}`],
        [`Promedio: ${resultados.length > 0 ? (resultados.reduce((sum, r: ResultadoExamen) => sum + r.puntaje_obtenido, 0) / resultados.length).toFixed(2) : 'N/A'}`],
        [`Nota más alta: ${resultados.length > 0 ? Math.max(...resultados.map((r: ResultadoExamen) => r.puntaje_obtenido)).toFixed(2) : 'N/A'}`],
        [`Nota más baja: ${resultados.length > 0 ? Math.min(...resultados.map((r: ResultadoExamen) => r.puntaje_obtenido)).toFixed(2) : 'N/A'}`],
        [''],
        [''] // Línea en blanco antes de los datos de estudiantes
      ];
      
      // Crear cabeceras de columnas
      const columnsRow = ['Apellidos', 'Nombres', 'Identificación', 'Nota', 'Porcentaje', 'Fecha de Calificación'];
      
      // Combinar todo en una matriz
      const allData = [...headerData, columnsRow];
      
      // Agregar los datos de estudiantes convertidos a filas
      dataToExport.forEach(row => {
        allData.push(Object.values(row));
      });
      
      // Crear hoja y añadirla al libro
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Aplicar estilos (merge cells para título y secciones)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Detalles del examen
        { s: { r: 8, c: 0 }, e: { r: 8, c: 5 } }  // Estadísticas
      ];
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");
      
      // Generar el archivo y descargarlo
      XLSX.writeFile(wb, `resultados_${examDetails.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

      toast({
        title: "Éxito",
        description: "Resultados exportados correctamente",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar los resultados",
        variant: "destructive",
      });
      if (DEBUG) {
        // Registramos el error en un logger en lugar de la consola
      }
    }
  };


  const handleExportToPDF = async (updateProgress: (_progress: number) => void) => {
    if (!examDetails || resultados.length === 0) {
      toast({
        title: "Error",
        description: "No hay resultados para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Preparando PDF",
        description: "Cargando imágenes y preparando el reporte...",
      });
      
      // Cargar imágenes para los resultados con seguimiento de progreso real
      const updatedResultados = await loadImagesForPDF(updateProgress);
      
      // Actualizar los resultados con las imágenes cargadas
      setResultados(updatedResultados);
      
      toast({
        title: "PDF Generado",
        description: "El reporte PDF se ha generado correctamente.",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
      if (DEBUG) {
        // Registramos el error en un logger en lugar de la consola
      }
    }
  };

  // Nueva función para manejar la selección de grupo
  const handleGroupSelect = (grupoId: string) => {
    // Solo tomar acción si el grupo seleccionado es diferente al actual
    if (grupoId !== selectedGroupId) {
      // Cerrar el modal primero
      setShowGroupSelectionModal(false);
      
      // Actualizar la UI para mostrar que estamos cargando
      setLoading(true);
      
      // Guardar el grupo seleccionado en localStorage
      try {
        const examId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
        localStorage.setItem(`exam_${examId}_selected_group`, grupoId);
      } catch (_error) {
        // Manejar el error silenciosamente
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
      }
      
      // Llamar a fetchExamResults con el nuevo ID de grupo
      fetchExamResults(grupoId);
    } else {
      // Si es el mismo grupo, solo cerrar el modal
      setShowGroupSelectionModal(false);
    }
  };

  const handleToggleGroupSelectionModal = () => {
    setShowGroupSelectionModal(prev => !prev);
  };

  // Manejar el cierre del modal con X
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      // Si se cierra y no hay grupo seleccionado pero hay grupos disponibles
      if (!selectedGroupId && availableGroups.length > 0) {
        const defaultGroupId = availableGroups[0].grupo_id;
        // Actualizar la UI para mostrar que estamos cargando
        setLoading(true);
        
        // Llamar a fetchExamResults con el grupo por defecto
        fetchExamResults(defaultGroupId);
      }
    }
    setShowGroupSelectionModal(open);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()} 
          className="h-9"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Exámenes
        </Button>

        {availableGroups.length > 1 && (
          <Button 
            onClick={handleToggleGroupSelectionModal}
            variant="outline"
            className="flex items-center text-xs sm:text-sm bg-card text-foreground dark:text-foreground dark:hover:text-background"
          >
            <div className="flex items-center px-3 py-2 w-full h-full">
              <Users className="mr-2 h-4 w-4 " />
              <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                GRUPO: {examDetails?.grupos?.nombre || 'Sin grupo'}
              </span>
            </div>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resultados: {examDetails?.titulo || 'Cargando...'}</h2>
          <p className="text-muted-foreground">
            Detalles de calificaciones y respuestas de los estudiantes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleExportToExcel}
            variant="default"
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Descargar notas en Excel</span>
            <span className="inline sm:hidden">Reporte Excel</span>
          </Button>
          
          {resultados.length > 0 && (
            <div>
              <div className="hidden sm:block">
                <PDFExportButton 
                  resultados={resultados} 
                  examDetails={examDetails}
                  fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
                  buttonText="Generar reporte en PDF"
                  onPrepare={(updateProgress) => handleExportToPDF(updateProgress)}
                  totalPreguntas={totalPreguntas}
                />
              </div>
              <div className="sm:hidden block">
                <PDFExportButton 
                  resultados={resultados} 
                  examDetails={examDetails}
                  fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
                  buttonText="Reporte PDF"
                  onPrepare={(updateProgress) => handleExportToPDF(updateProgress)}
                  totalPreguntas={totalPreguntas}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {examDetails && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Detalles del Examen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Materia:</div>
                  <div>{examDetails.materias?.nombre || 'Sin materia'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Puntaje Total:</div>
                  <div>{examDetails.puntaje_total}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Grupo:</div>
                  <div>{examDetails.grupos?.nombre || 'Sin grupo'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Fecha de Creación:</div>
                  <div>{examDetails.created_at ? new Date(examDetails.created_at as string).toLocaleDateString() : 'No disponible'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Estudiantes con examen:</div>
                  <div>{resultados.length} de {todosEstudiantes.length}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Promedio:</div>
                  <div>
                    {resultados.length > 0
                      ? (resultados.reduce((sum, r: ResultadoExamen) => sum + r.puntaje_obtenido, 0) / resultados.length).toFixed(2)
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Nota más alta:</div>
                  <div>
                    {resultados.length > 0
                      ? Math.max(...resultados.map((r: ResultadoExamen) => r.puntaje_obtenido)).toFixed(2)
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Nota más baja:</div>
                  <div>
                    {resultados.length > 0
                      ? Math.min(...resultados.map((r: ResultadoExamen) => r.puntaje_obtenido)).toFixed(2)
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="ver-solo-con-examen"
            checked={verSoloConExamen}
            onChange={(e) => setVerSoloConExamen(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="ver-solo-con-examen" className="text-sm">
            Ver solo estudiantes con examen calificado
          </label>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes</CardTitle>
            <CardDescription>
              Resultados de los estudiantes en este examen
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {todosEstudiantes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay estudiantes en este grupo
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-2 px-4 text-left">Nombre</th>
                      <th className="py-2 px-4 text-left">Identificación</th>
                      <th className="py-2 px-4 text-center">Nota</th>
                      <th className="py-2 px-4 text-center">Porcentaje</th>
                      <th className="py-2 px-4 text-center">Estado</th>
                      <th className="py-2 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosEstudiantes
                      .filter(estudiante => {
                        if (!verSoloConExamen) return true;
                        return resultados.some(r => r.estudiante.id === estudiante.id);
                      })
                      .map(estudiante => {
                        const resultado = resultados.find(r => r.estudiante.id === estudiante.id);
                        return (
                          <tr key={estudiante.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4">{estudiante.apellidos}, {estudiante.nombres}</td>
                            <td className="py-2 px-4">{estudiante.identificacion}</td>
                            <td className="py-2 px-4 text-center">
                              {resultado ? resultado.puntaje_obtenido.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {resultado ? resultado.porcentaje.toFixed(1) + '%' : '-'}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {resultado ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground font-medium shadow-sm">
                                  Calificado
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground font-medium shadow-sm">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {resultado ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShowDetails(resultado)}
                                >
                                  Ver detalles
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShowManualGradeDialog(estudiante)}
                                >
                                  Ingresar Nota
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de respuesta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar la respuesta de la pregunta {pendingUpdate?.preguntaOrden} a la opción {pendingUpdate?.nuevaLetra}?
              <br /><br />
              Esta acción recalculará automáticamente la calificación del examen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingUpdate(null);
              }}
              disabled={updatingAnswer}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={updatingAnswer}
            >
              {updatingAnswer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Confirmar cambio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nuevo diálogo para mostrar detalles del examen de un estudiante */}
      <Dialog 
        open={showDetailsDialog} 
        onOpenChange={setShowDetailsDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Examen</DialogTitle>
            <DialogDescription>
              Resultados detallados para {selectedResultado?.estudiante.nombres} {selectedResultado?.estudiante.apellidos}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResultado && (
            <Tabs defaultValue="answers" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="answers">Respuestas</TabsTrigger>
                <TabsTrigger value="original">Imagen Original</TabsTrigger>
                <TabsTrigger value="processed">Imagen Procesada</TabsTrigger>
              </TabsList>
              
              <TabsContent value="answers">
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-medium">Nota: {selectedResultado?.puntaje_obtenido.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Porcentaje: {selectedResultado?.porcentaje.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total preguntas: {totalPreguntas} | Válidas: {selectedResultado?.respuestas_estudiante.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      {/* Primera columna: preguntas hasta 20 */}
                      {selectedResultado && Array.from({ length: Math.min(20, totalPreguntas) }, (_, i) => i + 1).map((orden: number) => {
                        // Buscar si existe respuesta para esta pregunta
                        const respuesta = selectedResultado.respuestas_estudiante.find(
                          r => r.pregunta.orden === orden
                        );
                        
                        if (respuesta) {
                          // Si la pregunta tiene respuesta, mostrarla normalmente
                          return (
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
                                  const opcion = respuesta.pregunta.opciones_respuesta.find(o => o.orden === num);
                                  
                                  return (
                                    <div 
                                      key={`bubble-${respuesta.id}-${num}`}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                                        ${isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200'}
                                        ${!respuesta.pregunta.habilitada ? '' : 'cursor-pointer hover:opacity-80 transition-opacity'}
                                      `}
                                      onClick={() => {
                                        if (!respuesta.pregunta.habilitada || !opcion) return;
                                        handleBubbleClick(
                                          respuesta,
                                          num,
                                          selectedResultado.id,
                                          opcion.id
                                        );
                                      }}
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
                          );
                        } else {
                          // Si la pregunta no tiene respuesta, mostrar burbujas vacías con X
                          return (
                            <div 
                              key={`pregunta-sin-respuesta-${orden}`} 
                              className="flex items-center"
                              data-testid={`pregunta-sin-respuesta-${orden}`}
                            >
                              <span className="text-sm font-medium min-w-[25px]">
                                {orden}.
                              </span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4].map((num) => (
                                  <div 
                                    key={`bubble-sin-respuesta-${orden}-${num}`}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-200"
                                  >
                                    {/* Burbuja vacía */}
                                  </div>
                                ))}
                              </div>
                              <span className="ml-2 text-xs text-red-600">
                                ✗
                              </span>
                            </div>
                          );
                        }
                      })}
                    </div>
                    <div className="space-y-2">
                      {/* Segunda columna: preguntas mayores a 20 */}
                      {selectedResultado && totalPreguntas > 20 && (
                        Array.from({ length: totalPreguntas - 20 }, (_, i) => i + 21).map((orden: number) => {
                          // Buscar si existe respuesta para esta pregunta
                          const respuesta = selectedResultado.respuestas_estudiante.find(
                            r => r.pregunta.orden === orden
                          );
                          
                          if (respuesta) {
                            // Si la pregunta tiene respuesta, mostrarla normalmente
                            return (
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
                                    const opcion = respuesta.pregunta.opciones_respuesta.find(o => o.orden === num);
                                    
                                    return (
                                      <div 
                                        key={`bubble-${respuesta.id}-${num}`}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                                          ${isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200'}
                                          ${!respuesta.pregunta.habilitada ? '' : 'cursor-pointer hover:opacity-80 transition-opacity'}
                                        `}
                                        onClick={() => {
                                          if (!respuesta.pregunta.habilitada || !opcion) return;
                                          handleBubbleClick(
                                            respuesta,
                                            num,
                                            selectedResultado.id,
                                            opcion.id
                                          );
                                        }}
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
                            );
                          } else {
                            // Si la pregunta no tiene respuesta, mostrar burbujas vacías con X
                            return (
                              <div 
                                key={`pregunta-sin-respuesta-${orden}`} 
                                className="flex items-center"
                                data-testid={`pregunta-sin-respuesta-${orden}`}
                              >
                                <span className="text-sm font-medium min-w-[25px]">
                                  {orden}.
                                </span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4].map((num) => (
                                    <div 
                                      key={`bubble-sin-respuesta-${orden}-${num}`}
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-200"
                                    >
                                      {/* Burbuja vacía */}
                                    </div>
                                  ))}
                                </div>
                                <span className="ml-2 text-xs text-red-600">
                                  ✗
                                </span>
                              </div>
                            );
                          }
                        })
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="original">
                {selectedResultado.examen_escaneado?.ruta_s3_original ? (
                  <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-card dark:bg-card">
                    <ImageWithSignedUrl
                      path={selectedResultado.examen_escaneado.ruta_s3_original}
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
                {selectedResultado.examen_escaneado?.ruta_s3_procesado ? (
                  <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-card dark:bg-card">
                    <ImageWithSignedUrl
                      path={selectedResultado.examen_escaneado.ruta_s3_procesado}
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
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ingresar calificación manual */}
      <Dialog open={showManualGradeDialog} onOpenChange={setShowManualGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar calificación manual</DialogTitle>
            <DialogDescription>
              Esta funcionalidad está diseñada para casos especiales donde el estudiante no realizó el examen general, como recuperaciones o supletorios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md mt-3 mb-4 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">
              Si posteriormente se escanea un examen para este estudiante, esta calificación manual será reemplazada por el resultado del escaneo.
            </span>
          </div>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="estudiante">Estudiante</Label>
              <Input 
                id="estudiante" 
                value={selectedEstudiante ? `${selectedEstudiante.apellidos}, ${selectedEstudiante.nombres}` : ''} 
                disabled 
              />
            </div>
            
            <div>
              <Label htmlFor="grade">Calificación (0-5)</Label>
              <Input 
                id="grade" 
                type="number" 
                step="0.1"
                min="0" 
                max="5" 
                value={manualGrade} 
                onChange={(e) => setManualGrade(e.target.value)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManualGradeDialog(false)}
              disabled={isSubmittingGrade}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveManualGrade}
              disabled={isSubmittingGrade || !manualGrade}
            >
              {isSubmittingGrade ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar calificación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Selection Dialog */}
      <Dialog open={showGroupSelectionModal} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Grupo</DialogTitle>
            <DialogDescription>
              Este examen está asignado a múltiples grupos. Seleccione el grupo para ver sus resultados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableGroups.map((grupo) => (
              <Button
                key={grupo.grupo_id}
                onClick={() => handleGroupSelect(grupo.grupo_id)}
                variant={selectedGroupId === grupo.grupo_id ? "default" : "outline"}
                className="w-full justify-start"
              >
                {grupo.nombre}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageWithSignedUrl({ path, alt }: { path: string, alt: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Usar la función getStorageUrl del componente principal
  const getStorageUrl = async (filePath: string | null | undefined) => {
    if (!filePath) return '';
    
    try {
      // Usar la ruta exactamente como viene de la base de datos
      const { data, error: _error } = await supabase
        .storage
        .from('examenes-escaneados')
        .createSignedUrl(filePath, 3600);

      if (_error) {
        // Registramos el error en un logger en lugar de la consola
        return '';
      }

      return data.signedUrl;
    } catch (_error) {
      // Registramos el error en un logger en lugar de la consola
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
    <Image
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-contain"
      width={800}
      height={600}
      onError={() => setError(true)}
      unoptimized  // Usar unoptimized para URLs firmadas
    />
  );
} 