'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, BarChart3 } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// Helper para formatear fecha relativa
function formatRelativeDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  const isSpanish = locale === 'es';

  if (diffInMinutes < 1) {
    return isSpanish ? 'Hace un momento' : 'Just now';
  } else if (diffInMinutes < 60) {
    return isSpanish
      ? `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
      : `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return isSpanish
      ? `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
      : `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return isSpanish
      ? `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
      : `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return isSpanish
      ? `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
      : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return isSpanish
      ? `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
      : `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return isSpanish
      ? `Hace ${years} ${years === 1 ? 'año' : 'años'}`
      : `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

export function RecentExamsList() {
  const { stats, loading } = useDashboardStats();
  const t = useTranslations('dashboard.main.stats');
  const locale = useLocale();
  const router = useRouter();

  // Mapeo de estados a variantes de badge
  const getStatusVariant = (estado: string) => {
    switch (estado) {
      case 'publicado':
        return 'default';
      case 'borrador':
        return 'warning'; // Color amarillo/accent
      case 'archivado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.examenesRecientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('recentExams')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noExams')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentExams')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.examenesRecientes.map((examen) => (
            <div
              key={examen.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{examen.titulo}</h4>
                  <Badge variant={getStatusVariant(examen.estado)}>
                    {t(`examStatus.${examen.estado}`)}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                  {examen.materia_nombre && (
                    <>
                      <span className="truncate">{examen.materia_nombre}</span>
                      {examen.grupo_nombre && <span className="hidden sm:inline">•</span>}
                    </>
                  )}
                  {examen.grupo_nombre && (
                    <>
                      <span className="truncate">{examen.grupo_nombre}</span>
                      <span className="hidden sm:inline">•</span>
                    </>
                  )}
                  <span>{formatRelativeDate(examen.fecha_creacion, locale)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${locale}/dashboard/exams/${examen.id}/edit`)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('actions.edit')}</span>
                </Button>
                {/* Solo mostrar botón de resultados si el examen NO está en borrador */}
                {examen.estado !== 'borrador' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/exams/${examen.id}/results`)}
                    className="flex-1 sm:flex-none"
                  >
                    <BarChart3 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">{t('actions.viewResults')}</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
