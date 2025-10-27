import { cn } from '@/lib/utils';
import { AnswerBubble } from './answer-bubble';
import { getLetterFromNumber } from '../utils/answer-helpers';
import type { RespuestaEstudiante } from '../utils/types';

interface AnswerBubblesGridProps {
  respuestas: RespuestaEstudiante[];
  totalPreguntas: number;
  resultadoId?: string;
  onBubbleClick?: (respuesta: RespuestaEstudiante, opcionOrden: number, resultadoId: string, opcionId: string) => void;
  readonly?: boolean;
}

export function AnswerBubblesGrid({
  respuestas,
  totalPreguntas,
  resultadoId,
  onBubbleClick,
  readonly = false
}: AnswerBubblesGridProps) {
  const renderQuestion = (orden: number) => {
    const respuesta = respuestas.find(r => r.pregunta.orden === orden);

    if (respuesta) {
      return (
        <div
          key={respuesta.id}
          className="flex items-center"
        >
          <span className={cn(
            'text-sm font-medium min-w-[25px]',
            !respuesta.pregunta.habilitada && 'line-through opacity-40'
          )}>
            {respuesta.pregunta.orden}.
          </span>
          <div className={cn(
            'flex items-center space-x-1',
            !respuesta.pregunta.habilitada && 'opacity-30'
          )}>
            {Array.from({ length: respuesta.pregunta.num_opciones || 4 }, (_, i) => i + 1).map((num) => {
              const letter = getLetterFromNumber(num);
              const isSelected = respuesta.opcion_respuesta.orden === num;
              const opcion = respuesta.pregunta.opciones_respuesta.find(o => o.orden === num);

              return (
                <AnswerBubble
                  key={`bubble-${respuesta.id}-${num}`}
                  letter={letter}
                  isSelected={isSelected}
                  isDisabled={readonly || !respuesta.pregunta.habilitada}
                  onClick={() => {
                    if (!readonly && respuesta.pregunta.habilitada && opcion && resultadoId) {
                      onBubbleClick?.(respuesta, num, resultadoId, opcion.id);
                    }
                  }}
                />
              );
            })}
          </div>
          <span className={cn(
            'ml-2 text-xs',
            respuesta.es_correcta ? 'text-green-600' : 'text-red-600',
            !respuesta.pregunta.habilitada && 'opacity-30'
          )}>
            {respuesta.es_correcta ? '✓' : '✗'}
          </span>
        </div>
      );
    }

    // Question without answer
    return (
      <div
        key={`pregunta-sin-respuesta-${orden}`}
        className="flex items-center"
      >
        <span className="text-sm font-medium min-w-[25px]">{orden}.</span>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4].map((num) => (
            <AnswerBubble
              key={`bubble-sin-respuesta-${orden}-${num}`}
              letter=""
              isSelected={false}
              isDisabled={true}
            />
          ))}
        </div>
        <span className="ml-2 text-xs text-red-600">✗</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        {/* First column: questions 1-20 */}
        {Array.from({ length: Math.min(20, totalPreguntas) }, (_, i) => i + 1).map(renderQuestion)}
      </div>
      <div className="space-y-2">
        {/* Second column: questions 21+ */}
        {totalPreguntas > 20 &&
          Array.from({ length: totalPreguntas - 20 }, (_, i) => i + 21).map(renderQuestion)
        }
      </div>
    </div>
  );
}
