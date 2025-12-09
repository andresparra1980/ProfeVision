import { cn } from '@/lib/utils';
import { AnswerBubble } from './answer-bubble';
import { getLetterFromNumber } from '../utils/answer-helpers';
import type { RespuestaEstudiante } from '../utils/types';

interface AnswerBubblesGridProps {
  respuestas: RespuestaEstudiante[];
  totalPreguntas: number;
  resultadoId?: string;
  onBubbleClick?: (_respuesta: RespuestaEstudiante, _opcionOrden: number, _resultadoId: string, _opcionId: string) => void;
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
            'text-xs font-medium font-mono min-w-[30px]',
            !respuesta.pregunta.habilitada && 'line-through opacity-40'
          )}>
            {respuesta.pregunta.orden}. 
          </span>
          <div className={cn(
            'flex items-center gap-1.5',
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
            'text-xs',
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
        <span className="text-xs font-medium font-mono min-w-[30px]">{orden}. </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((num) => (
            <AnswerBubble
              key={`bubble-sin-respuesta-${orden}-${num}`}
              letter=""
              isSelected={false}
              isDisabled={true}
            />
          ))}
        </div>
        <span className="text-xs text-red-600">✗</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-muted border-2 rounded-lg shadow-md p-4 md:p-6 mx-auto overflow-auto w-full max-w-[500px]" style={{ maxHeight: '55vh' }}>
      <div className="flex gap-3 md:gap-6 items-start">
        <div className="space-y-1.5 flex-1 flex flex-col items-end">
          {/* First column: questions 1-20 */}
          {Array.from({ length: Math.min(20, totalPreguntas) }, (_, i) => i + 1).map(renderQuestion)}
        </div>
        
        {/* Vertical separator */}
        <div className="w-px bg-border flex-shrink-0 self-stretch" />
        
        <div className="space-y-1.5 flex-1 flex flex-col items-start">
          {/* Second column: questions 21+ */}
          {totalPreguntas > 20 &&
            Array.from({ length: totalPreguntas - 20 }, (_, i) => i + 21).map(renderQuestion)
          }
        </div>
      </div>
    </div>
  );
}
