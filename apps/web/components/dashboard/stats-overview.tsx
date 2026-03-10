'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  dashboardCardClassName,
} from '@/components/ui/card';
import { Building2, BookOpen, Folders, UsersRound } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

export function StatsOverview() {
  const { stats, loading } = useDashboardStats();
  const t = useTranslations('dashboard.main.stats');

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: t('totalInstitutions'),
      value: stats.totalInstituciones,
      icon: Building2,
      iconColor: 'text-sky-700 dark:text-sky-300',
      bgColor: 'bg-sky-100/85 dark:border dark:border-sky-400/20 dark:bg-sky-500/10 dark:shadow-[0_0_24px_-12px_rgba(56,189,248,0.65)]',
      glow: 'from-sky-500/18 via-cyan-400/8 to-transparent',
    },
    {
      title: t('totalSubjects'),
      value: stats.totalMaterias,
      icon: BookOpen,
      iconColor: 'text-cyan-700 dark:text-cyan-300',
      bgColor: 'bg-cyan-100/85 dark:border dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:shadow-[0_0_24px_-12px_rgba(34,211,238,0.65)]',
      glow: 'from-cyan-500/18 via-sky-400/8 to-transparent',
    },
    {
      title: t('activeGroups'),
      value: stats.gruposActivos,
      subtitle: `${stats.gruposArchivados} ${t('archivedGroups').toLowerCase()}`,
      icon: Folders,
      iconColor: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-100/85 dark:border dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:shadow-[0_0_24px_-12px_rgba(52,211,153,0.65)]',
      glow: 'from-emerald-500/18 via-teal-400/8 to-transparent',
    },
    {
      title: t('totalStudents'),
      value: stats.totalEstudiantes,
      icon: UsersRound,
      iconColor: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-100/85 dark:border dark:border-amber-400/20 dark:bg-amber-500/10 dark:shadow-[0_0_24px_-12px_rgba(251,191,36,0.6)]',
      glow: 'from-amber-500/18 via-orange-400/8 to-transparent',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`${dashboardCardClassName} group`}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${stat.glow} opacity-70 blur-xl`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl p-2 backdrop-blur-sm ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
              {stat.subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
