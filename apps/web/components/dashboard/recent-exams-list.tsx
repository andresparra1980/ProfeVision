'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Edit, BarChart3, Printer } from 'lucide-react';
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

  // Función para obtener el badge con estilo rotado (copiado de ExamsTableMobile)
  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]";

    switch (status) {
      case "borrador":
        return (
          <span className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-900/30 dark:text-amber-300`}>
            {t('examStatus.borrador')}
          </span>
        );
      case "publicado":
        return (
          <span className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-900/30 dark:text-emerald-300`}>
            {t('examStatus.publicado')}
          </span>
        );
      case "archivado":
        return (
          <span className={`${baseClass} border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}>
            {t('examStatus.archivado')}
          </span>
        );
      default:
        return (
          <span className={`${baseClass} border-border bg-muted text-muted-foreground`}>
            {status}
          </span>
        );
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

  // Componente para el contenido del examen (info básica)
  const ExamHeader = ({ examen }: { examen: typeof stats.examenesRecientes[0] }) => (
    <div className="flex-1 min-w-0 w-full space-y-2">
      {/* Línea 1: Título en bold */}
      <h4 className="font-bold text-base text-left break-words">{examen.titulo}</h4>

      {/* Línea 2: Materia en monofont + Tiempo relativo */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {examen.materia_nombre && (
          <span className={`font-mono`}>{examen.materia_nombre}</span>
        )}
        <span className="shrink-0">•</span>
        <span className="shrink-0">{formatRelativeDate(examen.fecha_creacion, locale)}</span>
      </div>

      {/* Línea 3: Group pills - above status badge */}
      {examen.grupos_nombres && examen.grupos_nombres.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-start">
          {examen.grupos_nombres.map((nombreGrupo, index) => (
            <span
              key={`${examen.id}-${nombreGrupo}-${index}`}
              className="inline-flex items-center justify-center rounded-full bg-secondary text-white px-2 py-0.5 text-[10px] font-medium shadow-sm"
            >
              {nombreGrupo}
            </span>
          ))}
        </div>
      )}

      {/* Línea 4: Badge de estado */}
      <div className="flex justify-start">
        {getStatusBadge(examen.estado)}
      </div>
    </div>
  );

  // Componente para los botones de acción
  const ExamActions = ({ examen }: { examen: typeof stats.examenesRecientes[0] }) => (
    <div className="flex flex-col gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/${locale}/dashboard/exams/${examen.id}/edit`)}
        className="w-full justify-start rounded-xl"
      >
        <Edit className="h-3.5 w-3.5 mr-2" />
        {t('actions.edit')}
      </Button>
      {examen.estado !== 'borrador' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/exams/${examen.id}/export`)}
            className="w-full justify-start rounded-xl"
          >
            <Printer className="h-3.5 w-3.5 mr-2" />
            {t('actions.exportAndPrint')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/exams/${examen.id}/results`)}
            className="w-full justify-start rounded-xl"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            {t('actions.viewResults')}
          </Button>
        </>
      )}
    </div>
  );

  // Limitar a 5 exámenes recientes
  const recentExams = stats.examenesRecientes.slice(0, 5);

  return (
    <Card className="overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-muted/35 shadow-[0_26px_58px_-36px_rgba(15,23,42,0.42)] dark:border-border/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80">
      <CardHeader>
        <CardTitle className="break-words text-xl font-semibold tracking-tight">{t('recentExams')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {/* Siempre mostrar en formato acordeón */}
        <Accordion type="single" collapsible className="w-full space-y-2">
          {recentExams.map((examen) => (
            <AccordionItem
              value={examen.id}
              key={examen.id}
              className="overflow-hidden rounded-2xl border border-border/35 bg-background/75 shadow-sm dark:border-border/45 dark:bg-zinc-900/80"
            >
              <AccordionTrigger className="p-3 hover:no-underline [&>svg]:shrink-0">
                <ExamHeader examen={examen} />
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden border-t border-border/35 bg-muted/25 p-3 dark:border-border/45 dark:bg-muted/15">
                <ExamActions examen={examen} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
