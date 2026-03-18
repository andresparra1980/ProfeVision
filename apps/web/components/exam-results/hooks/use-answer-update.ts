import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { AnswerBubbleClickData, RespuestaEstudiante, ResultadoExamen, PendingUpdate } from '../utils/types';
import { getLetterFromNumber } from '../utils/answer-helpers';

interface UseAnswerUpdateProps {
  examId: string | string[];
  setResultados: React.Dispatch<React.SetStateAction<ResultadoExamen[]>>;
  setSelectedResultado?: React.Dispatch<React.SetStateAction<ResultadoExamen | null>>;
}

export function useAnswerUpdate({ examId, setResultados, setSelectedResultado }: UseAnswerUpdateProps) {
  const t = useTranslations('dashboard.exams.results');
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [updatingAnswer, setUpdatingAnswer] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleBubbleClick = ({ respuesta, pregunta, opcionOrden, resultadoId, opcionId }: AnswerBubbleClickData) => {
    // No permitir cambios si la pregunta está deshabilitada
    if (!pregunta.habilitada) return;

    // No permitir seleccionar la misma opción
    if (respuesta?.opcion_respuesta.orden === opcionOrden) return;

    // Preparar datos para el modal de confirmación
    setPendingUpdate({
      respuestaId: respuesta?.id,
      preguntaId: pregunta.id,
      opcionId,
      opcionOrden,
      resultadoId,
      preguntaOrden: pregunta.orden,
      nuevaLetra: getLetterFromNumber(opcionOrden),
      pregunta,
    });

    // Mostrar el modal de confirmación
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      setUpdatingAnswer(true);

      const examIdString = typeof examId === 'string' ? examId : Array.isArray(examId) ? examId[0] : '';

      const response = await fetch(`/api/exams/${examIdString}/update-answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respuestaId: pendingUpdate.respuestaId,
          resultadoId: pendingUpdate.resultadoId,
          preguntaId: pendingUpdate.preguntaId,
          opcionId: pendingUpdate.opcionId,
        }),
      });

      if (!response.ok) {
        const _error = await response.json();
        throw new Error(_error.error || 'Error al actualizar la respuesta');
      }

      const result = await response.json();
      const selectedOption = pendingUpdate.pregunta.opciones_respuesta.find(
        opcion => opcion.id === pendingUpdate.opcionId
      );

      // Actualizar el estado local con la nueva información
      setResultados(prevResultados => {
        const updatedResultados = prevResultados.map(resultado => {
          if (resultado.id === pendingUpdate.resultadoId) {
            const existingResponseIndex = resultado.respuestas_estudiante.findIndex(
              respuesta => respuesta.pregunta_id === pendingUpdate.preguntaId
            );

            const nextResponse: RespuestaEstudiante = existingResponseIndex >= 0
              ? {
                  ...resultado.respuestas_estudiante[existingResponseIndex],
                  id: result.respuestaId,
                  opcion_id: pendingUpdate.opcionId,
                  es_correcta: result.es_correcta,
                  puntaje_obtenido: result.puntajeRespuesta,
                  pregunta: pendingUpdate.pregunta,
                  opcion_respuesta: {
                    id: pendingUpdate.opcionId,
                    orden: selectedOption?.orden || pendingUpdate.opcionOrden,
                  },
                }
              : {
                  id: result.respuestaId,
                  pregunta_id: pendingUpdate.preguntaId,
                  opcion_id: pendingUpdate.opcionId,
                  es_correcta: result.es_correcta,
                  puntaje_obtenido: result.puntajeRespuesta,
                  pregunta: pendingUpdate.pregunta,
                  opcion_respuesta: {
                    id: pendingUpdate.opcionId,
                    orden: selectedOption?.orden || pendingUpdate.opcionOrden,
                  },
                };

            const respuestasEstudiante = existingResponseIndex >= 0
              ? resultado.respuestas_estudiante.map((respuesta, index) =>
                  index === existingResponseIndex ? nextResponse : respuesta
                )
              : [...resultado.respuestas_estudiante, nextResponse].sort(
                  (a, b) => a.pregunta.orden - b.pregunta.orden
                );

            const updatedResultado = {
              ...resultado,
              puntaje_obtenido: result.puntajeObtenido,
              porcentaje: result.porcentaje,
              respuestas_estudiante: respuestasEstudiante,
            };

            // Si este resultado es el que está seleccionado actualmente en el modal, actualizarlo también
            if (setSelectedResultado) {
              setTimeout(() => setSelectedResultado(updatedResultado), 0);
            }

            return updatedResultado;
          }
          return resultado;
        });

        return updatedResultados;
      });

      toast.success(t('toast.answerUpdated'), {
        description: t('toast.answerUpdatedDesc'),
      });

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(t('toast.updateError'), {
          description: String(error.message) || t('toast.updateErrorDesc'),
        });
      } else {
        toast.error(t('toast.updateError'), {
          description: t('toast.updateErrorDesc'),
        });
      }
    } finally {
      setUpdatingAnswer(false);
      setShowConfirmDialog(false);
      setPendingUpdate(null);
    }
  };

  return {
    pendingUpdate,
    updatingAnswer,
    showConfirmDialog,
    setShowConfirmDialog,
    handleBubbleClick,
    handleConfirmUpdate,
  };
}
