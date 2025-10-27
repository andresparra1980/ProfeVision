import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from '@tremor/react';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ResultadoExamen } from '../utils/types';

interface QuestionAnalysisCardProps {
  resultados: ResultadoExamen[];
  totalPreguntas: number;
}

export function QuestionAnalysisCard({ resultados, totalPreguntas }: QuestionAnalysisCardProps) {
  const t = useTranslations('dashboard.exams.results.questionAnalysis');

  // Calculate % correct for each question with color coding
  const questionStats = useMemo(() => {
    const stats = Array.from({ length: totalPreguntas }, (_, i) => {
      const questionNum = i + 1;
      let correctCount = 0;
      let totalCount = 0;

      resultados.forEach(resultado => {
        const respuesta = resultado.respuestas_estudiante.find(
          r => r.pregunta.orden === questionNum && r.pregunta.habilitada
        );
        if (respuesta) {
          totalCount++;
          if (respuesta.es_correcta) correctCount++;
        }
      });

      const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

      return {
        question: `P${questionNum}`,
        'Correctas (%)': parseFloat(percentage.toFixed(1)),
        correctCount,
        totalCount,
        percentage,
      };
    });

    return stats;
  }, [resultados, totalPreguntas]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const validStats = questionStats.filter(s => s.totalCount > 0);
    if (validStats.length === 0) {
      return { average: 0, highest: 0, lowest: 0, easiestQ: 0, hardestQ: 0 };
    }

    const percentages = validStats.map(s => s.percentage);
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    const easiest = validStats.reduce((prev, curr) =>
      curr.percentage > prev.percentage ? curr : prev
    );
    const hardest = validStats.reduce((prev, curr) =>
      curr.percentage < prev.percentage ? curr : prev
    );

    return {
      average: parseFloat(average.toFixed(1)),
      highest: parseFloat(highest.toFixed(1)),
      lowest: parseFloat(lowest.toFixed(1)),
      easiestQ: parseInt(easiest.question.substring(1)),
      hardestQ: parseInt(hardest.question.substring(1)),
    };
  }, [questionStats]);

  // Helper function to get color based on percentage
  const getColorForPercentage = (percentage: number): string => {
    if (percentage >= 70) return 'emerald'; // Easy (green)
    if (percentage >= 40) return 'amber'; // Medium (yellow)
    return 'rose'; // Hard (red)
  };

  // Get dynamic color for the chart (use the average)
  const chartColor = getColorForPercentage(statistics.average);

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
      <CardContent className="space-y-6">
        {/* Chart */}
        <div>
          <BarChart
            data={questionStats}
            index="question"
            categories={['Correctas (%)']}
            colors={[chartColor]}
            valueFormatter={(value) => `${value}%`}
            yAxisWidth={48}
            showAnimation={true}
            showLegend={false}
            showGridLines={true}
            className="h-72"
          />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          {/* Average */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              <span>{t('average')}</span>
            </div>
            <p className="text-2xl font-bold">{statistics.average}%</p>
          </div>

          {/* Highest */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>{t('easiest')}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statistics.highest}%
            </p>
            <p className="text-xs text-muted-foreground">P{statistics.easiestQ}</p>
          </div>

          {/* Lowest */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3 w-3" />
              <span>{t('hardest')}</span>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {statistics.lowest}%
            </p>
            <p className="text-xs text-muted-foreground">P{statistics.hardestQ}</p>
          </div>

          {/* Total Questions Analyzed */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t('questionsAnalyzed')}
            </div>
            <p className="text-2xl font-bold">{questionStats.filter(s => s.totalCount > 0).length}</p>
            <p className="text-xs text-muted-foreground">{t('of')} {totalPreguntas}</p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-4 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-muted-foreground">{t('legend.easy')} (≥70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
            <span className="text-muted-foreground">{t('legend.medium')} (40-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
            <span className="text-muted-foreground">{t('legend.hard')} (&lt;40%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
