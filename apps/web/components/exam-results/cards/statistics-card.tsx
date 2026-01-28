import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

import type { ResultadoExamen, Estudiante } from '../utils/types';

interface StatisticsCardProps {
  resultados: ResultadoExamen[];
  todosEstudiantes: Estudiante[];
}

export function StatisticsCard({ resultados, todosEstudiantes }: StatisticsCardProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('statisticsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('studentsWithExam')}:</div>
            <div className={`font-mono mono-data`}>{resultados.length} {t('of')} {todosEstudiantes.length}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('average')}:</div>
            <div className={`font-mono mono-data`}>
              {resultados.length > 0
                ? (resultados.reduce((sum, r) => sum + r.puntaje_obtenido, 0) / resultados.length).toFixed(2)
                : t('na')
              }
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('highestScore')}:</div>
            <div className={`font-mono mono-data`}>
              {resultados.length > 0
                ? Math.max(...resultados.map((r) => r.puntaje_obtenido)).toFixed(2)
                : t('na')
              }
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('lowestScore')}:</div>
            <div className={`font-mono mono-data`}>
              {resultados.length > 0
                ? Math.min(...resultados.map((r) => r.puntaje_obtenido)).toFixed(2)
                : t('na')
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
