'use client';

import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentExamsList } from '@/components/dashboard/recent-exams-list';
import { GradingStats } from '@/components/dashboard/grading-stats';
import { TierUsageStats } from '@/components/dashboard/tier-usage-stats';
import { useTranslations } from 'next-intl';
import { logoFont } from '@/lib/fonts';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      {/* Título */}
      <TitleCardWithDepth
        title={t('main.title')}
        description={
          <>
            {t('main.welcome1')}
            <span className={`text-secondary font-semibold ${logoFont}`}>ProfeVision</span>
            {t('main.welcome2')}
          </>
        }
      />

      {/* Estadísticas Generales */}
      <StatsOverview />

      {/* Grid de 2 columnas: Columna izquierda con Stats + Uso del Plan, Columna derecha con Exámenes Recientes */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <GradingStats />
          <TierUsageStats />
        </div>
        <div className="min-w-0">
          <RecentExamsList />
        </div>
      </div>
    </div>
  );
} 