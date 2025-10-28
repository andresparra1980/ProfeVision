'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';

// Función para formatear tiempo ahorrado
function formatTimeSaved(seconds: number, locale: string): string {
  const isSpanish = locale === 'es';

  if (seconds < 3600) {
    // Menos de 1 hora
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  } else if (seconds < 86400) {
    // Menos de 1 día
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  } else {
    // 1 día o más
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return isSpanish ? `${days}d ${hours}h` : `${days}d ${hours}h`;
  }
}

export function GradingStats() {
  const { stats, loading } = useDashboardStats();
  const t = useTranslations('dashboard.main.stats');
  const locale = useLocale();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const timeSavedFormatted = formatTimeSaved(stats.tiempoAhorradoSegundos, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          {t('gradedExams')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exámenes Calificados */}
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {t('gradedExams')}
          </p>
          <div className="text-3xl font-bold text-primary">
            {stats.examenesCalificados}
          </div>
        </div>

        {/* Tiempo Ahorrado */}
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            {t('timeSaved')}
          </p>
          <div className="text-3xl font-bold text-purple-600">
            {timeSavedFormatted}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('timeSavedContext')}
          </p>
        </div>

        {/* Barra de progreso visual - Eficiencia */}
        {stats.examenesCalificados > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                {locale === 'es' ? 'Eficiencia' : 'Efficiency'}
              </span>
              <span className="font-semibold text-primary">
                {locale === 'es' ? '98.3% más rápido' : '98.3% faster'}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: '98.3%' }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
