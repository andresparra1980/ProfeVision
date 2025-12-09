import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { RespuestaEstudiante, ResultadoExamen, PendingUpdate } from '../utils/types';
import { OPTION_LETTERS } from '../utils/constants';
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
