'use client';

import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentExamsList } from '@/components/dashboard/recent-exams-list';
import { GradingStats } from '@/components/dashboard/grading-stats';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      {/* Título */}
      <TitleCardWithDepth
        title={t('main.title')}
        description={t('main.welcome')}
      />

      {/* Estadísticas Generales */}
      <StatsOverview />

      {/* Grid de 2 columnas: Exámenes Recientes y Stats de Calificación */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentExamsList />
        <GradingStats />
      </div>
    </div>
  );
} 