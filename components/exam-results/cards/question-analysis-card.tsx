import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from '@tremor/react';
import { useTranslations } from 'next-intl';
import type { ResultadoExamen } from '../utils/types';

interface QuestionAnalysisCardProps {
  resultados: ResultadoExamen[];
  totalPreguntas: number;
}

export function QuestionAnalysisCard({ resultados, totalPreguntas }: QuestionAnalysisCardProps) {
  const t = useTranslations('dashboard.exams.results.questionAnalysis');

  // Calculate % correct for each question
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
        question: `${questionNum}`,
        'Correctas (%)': parseFloat(percentage.toFixed(1)),
        correctCount,
        totalCount,
      };
    });

    return stats;
  }, [resultados, totalPreguntas]);

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
        <BarChart
          data={questionStats}
          index="question"
          categories={['Correctas (%)']}
          colors={['blue']}
          valueFormatter={(value) => `${value}%`}
          yAxisWidth={48}
          showAnimation={true}
          className="h-72"
        />
      </CardContent>
    </Card>
  );
}
