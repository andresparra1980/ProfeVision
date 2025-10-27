import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from '@tremor/react';
import type { CustomTooltipProps } from '@tremor/react';
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

      // Check if question is disabled
      const isDisabled = resultados.some(resultado => {
        const resp = resultado.respuestas_estudiante.find(r => r.pregunta.orden === questionNum);
        return resp && !resp.pregunta.habilitada;
      });

      // Color bars by success rate: <60% rose, 60-79% amber, >=80% emerald
      const percentVal = parseFloat(percentage.toFixed(1));
      const excelente = percentage >= 80 ? percentVal : 0;
      const bueno = percentage >= 60 && percentage < 80 ? percentVal : 0;
      const bajo = percentage < 60 ? percentVal : 0;

      return {
        question: questionNum,
        'Excelente': excelente,
        'Bueno': bueno,
        'Bajo': bajo,
        correctCount,
        totalCount,
        percentage,
        isDisabled,
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
      easiestQ: easiest.question,
      hardestQ: hardest.question,
    };
  }, [questionStats]);

  // Single series: porcentaje de respuestas correctas

  // Color mapping for tooltip
  const categoryColors: Record<string, string> = {
    'Excelente': '#10b981', // emerald-500
    'Bueno': '#f59e0b',     // amber-500
    'Bajo': '#ef4444'       // rose-500
  };

  // Opaque, themed tooltip for Tremor charts
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    
    // Extract question number from label (e.g., "P1" or "Q1" -> 1)
    const labelStr = String(label);
    const questionNum = typeof label === 'number' ? label : parseInt(labelStr.replace(/\D/g, ''));
    const questionStat = questionStats.find(q => q.question === questionNum);
    const isDisabled = questionStat?.isDisabled || false;
    
    // Filter non-zero values and get the actual percentage
    const nonZero = payload.filter((p) => {
      const entry = p as unknown as { value?: number | string };
      const val = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
      return val > 0;
    });
    
    // Handle 0% case - show gray color
    if (nonZero.length === 0) {
      return (
        <div className="rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2">
          <div className="text-xs font-medium mb-1">
            {t('tooltip.question')} {questionNum}
            {isDisabled && <span className="ml-2 text-muted-foreground">({t('tooltip.disabled')})</span>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-400" />
            <span className="font-medium text-muted-foreground">0%</span>
          </div>
        </div>
      );
    }
    
    const entry = nonZero[0] as unknown as { color?: string; name?: string; value?: number | string };
    const categoryName = String(entry.name ?? '');
    const color = categoryColors[categoryName] || entry.color || '#10b981';
    const valueNum = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
    
    return (
      <div className="rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2">
        <div className="text-xs font-medium mb-1">
          {t('tooltip.question')} {questionNum}
          {isDisabled && <span className="ml-2 text-muted-foreground">({t('tooltip.disabled')})</span>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
          <span className="font-medium">{valueFormatter(valueNum)}</span>
        </div>
      </div>
    );
  };

  const valueFormatter = (value: number) => {
    const rounded = Math.round(value);
    return `${rounded}%`;
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
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="rounded-md border bg-card p-3 text-foreground dark:text-foreground [&_.recharts-text]:fill-foreground [&_.recharts-cartesian-axis-tick-value]:fill-current overflow-visible">
          <BarChart
            data={questionStats.map(stat => ({
              ...stat,
              question: `${t('axis.questionPrefix')}${stat.question}`
            }))}
            index="question"
            categories={['Excelente', 'Bueno', 'Bajo']}
            colors={['emerald', 'amber', 'rose']}
            valueFormatter={valueFormatter}
            yAxisWidth={56}
            stack={true}
            minValue={0}
            maxValue={100}
            showAnimation={true}
            showLegend={false}
            showGridLines={true}
            customTooltip={CustomTooltip}
            barCategoryGap="20%"
            className="h-72"
          />
          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-muted-foreground">(≥80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
            <span className="text-muted-foreground">(60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
            <span className="text-muted-foreground">(&lt;60%)</span>
          </div>
        </div>
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
              <span>{t('highest')}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statistics.highest}%
            </p>
            <p className="text-xs text-muted-foreground">{t('axis.questionPrefix')}{statistics.easiestQ}</p>
          </div>

          {/* Lowest */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3 w-3" />
              <span>{t('lowest')}</span>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {statistics.lowest}%
            </p>
            <p className="text-xs text-muted-foreground">{t('axis.questionPrefix')}{statistics.hardestQ}</p>
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

        
      </CardContent>
    </Card>
  );
}
