import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import logger from '@/lib/utils/logger';
import type {
  ExamDetails,
  ResultadoExamen,
  Estudiante,
  GrupoExamen,
  RespuestaEstudiante,
  OpcionRespuesta
} from '../utils/types';
import { DEBUG } from '../utils/constants';

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

export function useExamResults(examId: string | string[]) {
  const t = useTranslations('dashboard.exams.results');
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [resultados, setResultados] = useState<ResultadoExamen[]>([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState<Estudiante[]>([]);
  const [totalPreguntas, setTotalPreguntas] = useState<number>(0);
  const [enabledQuestionOrders, setEnabledQuestionOrders] = useState<number[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GrupoExamen[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const examIdString = typeof examId === 'string' ? examId : Array.isArray(examId) ? examId[0] : '';

  const fetchExamResults = useCallback(async (groupIdOverride?: string) => {
    try {
      setLoading(true);

      // Usar el groupIdOverride si se proporciona, de lo contrario usar selectedGroupId
      const groupIdToUse = groupIdOverride || selectedGroupId;

      // Obtener detalles del examen
      const { data: examData, error: examError } = await supabase
        .from('examenes')
        .select(`
          *,
          materias(
            nombre,
            entidades_educativas(nombre)
          )
        `)
        .eq('id', examIdString)
        .single();

      if (examError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
        throw examError;
      }

      setExamDetails(examData);

      // Obtener metadata de preguntas para numeración canónica
      const { data: preguntasData, error: preguntasError } = await supabase
        .from('preguntas')
        .select('orden, habilitada')
        .eq('examen_id', examIdString)
        .order('orden', { ascending: true });

      if (preguntasError) {
        setTotalPreguntas(0);
        setEnabledQuestionOrders([]);

        if (DEBUG) {
          logger.error('Error loading question metadata:', preguntasError);
        }

        toast.error(t('error'), {
          description: t('loadingError'),
        });
      } else if (preguntasData && preguntasData.length > 0) {
        const preguntas = preguntasData as Array<{ orden: number; habilitada: boolean }>;
        const highestQuestionOrder = Math.max(...preguntas.map((pregunta) => pregunta.orden));
        setTotalPreguntas(highestQuestionOrder);

        const enabledOrders = preguntas
          .filter((pregunta) => pregunta.habilitada)
          .map((pregunta) => pregunta.orden);

        setEnabledQuestionOrders(enabledOrders);
      } else {
        setTotalPreguntas(0);
        setEnabledQuestionOrders([]);
      }

      // Obtener todas las relaciones con grupos a través de examen_grupo
      const { data: examenGruposData, error: examenGruposError } = await supabase
        .from('examen_grupo')
        .select(`
          id,
          grupo_id,
          grupos(id, nombre)
        `)
        .eq('examen_id', examIdString);

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
            const storedGroupId = localStorage.getItem(`exam_${examIdString}_selected_group`);

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
              localStorage.setItem(`exam_${examIdString}_selected_group`, grupoToUse.grupo_id);
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
        .eq('examen_id', examIdString);

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
    } catch (error) {
      if (DEBUG) {
        logger.error('Error loading exam results:', error);
      }
      toast.error(t('error'), {
        description: t('loadingError'),
      });
    } finally {
      setLoading(false);
    }
  }, [examIdString, selectedGroupId, initializing, t]);

  useEffect(() => {
    fetchExamResults();
  }, [fetchExamResults]);

  return {
    loading,
    examDetails,
    resultados,
    todosEstudiantes,
    totalPreguntas,
    enabledQuestionOrders,
    availableGroups,
    selectedGroupId,
    setResultados,
    setSelectedGroupId,
    fetchExamResults,
  };
}
