import { cn } from '@/lib/utils';
import { AnswerBubble } from './answer-bubble';
import { getLetterFromNumber } from '../utils/answer-helpers';
import type { AnswerBubbleClickData, PreguntaExamen, RespuestaEstudiante } from '../utils/types';

interface AnswerBubblesGridProps {
  respuestas: RespuestaEstudiante[];
  preguntas?: PreguntaExamen[];
  totalPreguntas: number;
  resultadoId?: string;
  onBubbleClick?: (_data: AnswerBubbleClickData) => void;
  readonly?: boolean;
}

export function AnswerBubblesGrid({
  respuestas,
  preguntas = [],
  totalPreguntas,
  resultadoId,
  onBubbleClick,
  readonly = false
}: AnswerBubblesGridProps) {
  const questionDefinitions = preguntas.length > 0
    ? preguntas
    : Array.from({ length: totalPreguntas }, (_, i) => ({
        id: `question-${i + 1}`,
        orden: i + 1,
        puntaje: 0,
        num_opciones: 4,
        habilitada: true,
        opciones_respuesta: [],
      } satisfies PreguntaExamen));

  const firstColumnQuestions = questionDefinitions.slice(0, 20);
  const secondColumnQuestions = questionDefinitions.slice(20);

  const renderQuestion = (pregunta: PreguntaExamen) => {
    const orden = pregunta.orden;
    const respuesta = respuestas.find(r => r.pregunta.orden === orden);
    const questionData = respuesta?.pregunta ?? pregunta;

    if (respuesta) {
      return (
        <div
          key={respuesta.id}
          className="flex items-center"
        >
          <span className={cn(
            'text-xs font-medium font-mono min-w-[30px]',
            !questionData.habilitada && 'line-through opacity-40'
          )}>
            {questionData.orden}.
          </span>
          <div className={cn(
            'flex items-center gap-1.5',
            !questionData.habilitada && 'opacity-30'
          )}>
            {Array.from({ length: questionData.num_opciones || 4 }, (_, i) => i + 1).map((num) => {
              const letter = getLetterFromNumber(num);
              const isSelected = respuesta.opcion_respuesta.orden === num;
              const opcion = questionData.opciones_respuesta.find(o => o.orden === num);

              return (
                <AnswerBubble
                  key={`bubble-${respuesta.id}-${num}`}
                  letter={letter}
                  isSelected={isSelected}
                  isDisabled={readonly || !questionData.habilitada || !opcion}
                  onClick={() => {
                    if (!readonly && questionData.habilitada && opcion && resultadoId) {
                      onBubbleClick?.({
                        respuesta,
                        pregunta: questionData,
                        opcionId: opcion.id,
                        opcionOrden: num,
                        resultadoId,
                      });
                    }
                  }}
                />
              );
            })}
          </div>
          <span className={cn(
            'text-xs',
            respuesta.es_correcta ? 'text-green-600' : 'text-red-600',
            !questionData.habilitada && 'opacity-30'
          )}>
            {respuesta.es_correcta ? '✓' : '✗'}
          </span>
        </div>
      );
    }

    // Question without answer
    return (
      <div key={`pregunta-sin-respuesta-${orden}`} className="flex items-center">
        <span className={cn(
          'text-xs font-medium font-mono min-w-[30px]',
          !questionData.habilitada && 'line-through opacity-40'
        )}>
          {orden}.
        </span>
        <div className={cn('flex items-center gap-1.5', !questionData.habilitada && 'opacity-30')}>
          {Array.from({ length: questionData.num_opciones || 4 }, (_, i) => i + 1).map((num) => {
            const letter = getLetterFromNumber(num);
            const opcion = questionData.opciones_respuesta.find(o => o.orden === num);

            return (
            <AnswerBubble
              key={`bubble-sin-respuesta-${orden}-${num}`}
              letter={letter}
              isSelected={false}
              isDisabled={readonly || !questionData.habilitada || !opcion}
              onClick={() => {
                if (!readonly && questionData.habilitada && opcion && resultadoId) {
                  onBubbleClick?.({
                    pregunta: questionData,
                    opcionId: opcion.id,
                    opcionOrden: num,
                    resultadoId,
                  });
                }
              }}
            />
            );
          })}
        </div>
        <span className={cn('text-xs text-red-600', !questionData.habilitada && 'opacity-30')}>✗</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-muted border-2 rounded-lg shadow-md p-4 md:p-6 mx-auto overflow-auto w-full max-w-[500px]" style={{ maxHeight: '55vh' }}>
      <div className="flex gap-3 md:gap-6 items-start">
        <div className="space-y-1.5 flex-1 flex flex-col items-end">
          {/* First column: questions 1-20 */}
          {firstColumnQuestions.map(renderQuestion)}
        </div>
        
        {/* Vertical separator */}
        <div className="w-px bg-border flex-shrink-0 self-stretch" />
        
        <div className="space-y-1.5 flex-1 flex flex-col items-start">
          {/* Second column: questions 21+ */}
          {secondColumnQuestions.map(renderQuestion)}
        </div>
      </div>
    </div>
  );
}
