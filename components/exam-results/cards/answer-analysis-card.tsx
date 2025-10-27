import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from '@tremor/react';
import type { CustomTooltipProps } from '@tremor/react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import type { ResultadoExamen } from '../utils/types';
import { OPTION_LETTERS } from '../utils/constants';

interface AnswerAnalysisCardProps {
  resultados: ResultadoExamen[];
  totalPreguntas: number;
}

// Color mapping to match answer bubbles
const getAnswerColor = (letter: string): string => {
  switch (letter.toUpperCase()) {
    case 'A': return '#3b82f6'; // blue-500
    case 'B': return '#22c55e'; // green-500
    case 'C': return '#eab308'; // yellow-500
    case 'D': return '#a855f7'; // purple-500
    case 'E': return '#ec4899'; // pink-500
    case 'F': return '#6366f1'; // indigo-500
    case 'G': return '#ef4444'; // red-500
    case 'H': return '#f97316'; // orange-500
    default: return '#9ca3af'; // gray-400
  }
};

const getTremorColorName = (letter: string): string => {
  switch (letter.toUpperCase()) {
    case 'A': return 'blue';
    case 'B': return 'green';
    case 'C': return 'yellow';
    case 'D': return 'purple';
    case 'E': return 'pink';
    case 'F': return 'indigo';
    case 'G': return 'red';
    case 'H': return 'orange';
    default: return 'gray';
  }
};

export function AnswerAnalysisCard({ resultados, totalPreguntas }: AnswerAnalysisCardProps) {
  const t = useTranslations('dashboard.exams.results.answerAnalysis');

  // Calculate answer distribution for each question
  const answerDistribution = useMemo(() => {
    return Array.from({ length: totalPreguntas }, (_, i) => {
      const questionNum = i + 1;

      // Find all responses for this question
      const responsesForQuestion = resultados
        .map(resultado => resultado.respuestas_estudiante.find(
          r => r.pregunta.orden === questionNum && r.pregunta.habilitada
        ))
        .filter(Boolean);

      // Get question details (num_opciones, correct answer)
      const firstResponse = responsesForQuestion.find(r => r !== undefined);
      const numOpciones = firstResponse?.pregunta.num_opciones || 4;
      const opcionesRespuesta = firstResponse?.pregunta.opciones_respuesta || [];

      // Find correct answer
      const correctOption = opcionesRespuesta.find(opt => opt.es_correcta);
      const correctLetter = correctOption ? OPTION_LETTERS[correctOption.orden - 1] : null;

      // Count answers per option
      const answerCounts: Record<string, number> = {};
      const totalResponses = resultados.length;
      let answeredCount = 0;

      // Initialize counts for available options
      for (let j = 0; j < numOpciones; j++) {
        answerCounts[OPTION_LETTERS[j]] = 0;
      }

      // Count each answer
      responsesForQuestion.forEach(respuesta => {
        if (respuesta) {
          const optionLetter = OPTION_LETTERS[respuesta.opcion_respuesta.orden - 1];
          answerCounts[optionLetter] = (answerCounts[optionLetter] || 0) + 1;
          answeredCount++;
        }
      });

      // Count no answer
      const noAnswerCount = totalResponses - answeredCount;

      // Calculate percentages (as actual percentages 0-100)
      const percentages: Record<string, number> = {};
      Object.keys(answerCounts).forEach(letter => {
        percentages[letter] = totalResponses > 0
          ? (answerCounts[letter] / totalResponses) * 100
          : 0;
      });
      const noAnswerPercentage = totalResponses > 0
        ? (noAnswerCount / totalResponses) * 100
        : 0;

      // Build data object for this question
      // Order: A, B, C, D, ... (bottom to top), then No Answer
      const dataPoint: Record<string, string | number> = {
        question: questionNum, // Will be formatted in render
      };

      // Add answer options in order A, B, C, D...
      // Store as actual percentages (0-100)
      for (let j = 0; j < numOpciones; j++) {
        const letter = OPTION_LETTERS[j];
        dataPoint[letter] = Number(percentages[letter].toFixed(2));
      }

      // Add "No Answer" if there are any
      if (noAnswerCount > 0) {
        dataPoint['Sin Respuesta'] = Number(noAnswerPercentage.toFixed(2));
      }

      return {
        ...dataPoint,
        _meta: {
          totalResponses,
          answerCounts,
          noAnswerCount,
          correctLetter,
          numOpciones,
        }
      };
    });
  }, [resultados, totalPreguntas]);

  // Build categories array (A, B, C, D, ... , Sin Respuesta)
  const categories = useMemo(() => {
    // Find max number of options across all questions
    const maxOptions = Math.max(
      ...answerDistribution.map(q => q._meta?.numOpciones || 4)
    );

    const cats: string[] = [];
    for (let i = 0; i < maxOptions; i++) {
      cats.push(OPTION_LETTERS[i]);
    }

    // Add "No Answer" if any question has it
    const hasNoAnswer = answerDistribution.some(q => {
      const val = q['Sin Respuesta' as keyof typeof q];
      return typeof val === 'number' && val > 0;
    });
    if (hasNoAnswer) {
      cats.push('Sin Respuesta');
    }

    return cats;
  }, [answerDistribution]);

  // Build colors array matching categories
  const colors = useMemo(() => {
    return categories.map(cat =>
      cat === 'Sin Respuesta' ? 'gray' : getTremorColorName(cat)
    );
  }, [categories]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;

    // Extract question number from label (e.g., "P1" or "Q1" -> 1)
    const labelStr = String(label);
    const questionNum = parseInt(labelStr.replace(/\D/g, ''));
    const questionData = answerDistribution.find(q => Number(q['question' as keyof typeof q]) === questionNum);

    if (!questionData || !questionData._meta) return null;

    const { totalResponses, answerCounts, noAnswerCount, correctLetter, numOpciones } = questionData._meta;

    // Calculate valid answers (excluding no answer)
    const validAnswersCount = totalResponses - noAnswerCount;

    return (
      <div className="rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2 min-w-[200px]">
        <div className="text-xs font-semibold mb-2 pb-2 border-b">
          {t('tooltip.question')} {questionNum} ({validAnswersCount} {t('tooltip.responses')})
        </div>
        <div className="space-y-1.5">
          {/* Show all options */}
          {Array.from({ length: numOpciones }, (_, i) => {
            const letter = OPTION_LETTERS[i];
            const count = answerCounts[letter] || 0;
            const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
            const isCorrect = letter === correctLetter;
            const color = getAnswerColor(letter);

            return (
              <div key={letter} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={isCorrect ? 'font-bold flex items-center gap-1' : ''}>
                    {letter}:
                    {isCorrect && <Check className="h-3 w-3 text-green-600 dark:text-green-400" />}
                  </span>
                </div>
                <span className={isCorrect ? 'font-bold' : 'text-muted-foreground'}>
                  {percentage.toFixed(1)}% ({count})
                </span>
              </div>
            );
          })}

          {/* Show no answer if any */}
          {noAnswerCount > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0 bg-gray-400"
                />
                <span>{t('tooltip.noAnswer')}:</span>
              </div>
              <span className="text-muted-foreground">
                {((noAnswerCount / totalResponses) * 100).toFixed(1)}% ({noAnswerCount})
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (resultados.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border-2 bg-card p-3 text-foreground dark:text-foreground [&_.recharts-text]:fill-foreground [&_.recharts-cartesian-axis-tick-value]:fill-current overflow-visible">
          <BarChart
            data={answerDistribution.map(stat => ({
              ...stat,
              question: `${t('axis.questionPrefix')}${stat['question' as keyof typeof stat]}`
            }))}
            index="question"
            categories={categories}
            colors={colors}
            valueFormatter={(value) => `${Math.round(value)}%`}
            yAxisWidth={0}
            stack={true}
            minValue={0}
            maxValue={100}
            barCategoryGap="20%"
            showAnimation={true}
            showLegend={false}
            showGridLines={false}
            showYAxis={false}
            customTooltip={CustomTooltip}
            className="h-72"
          />
        </div>
        <div className="mt-4 pt-4 border-t text-xs italic font-bold text-muted-foreground">
          {t('hint')}
        </div>
      </CardContent>
    </Card>
  );
}
