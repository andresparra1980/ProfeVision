'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100/90 dark:bg-blue-950/70',
      glow: 'from-blue-500/20 to-cyan-400/5',
    },
    {
      title: t('totalSubjects'),
      value: stats.totalMaterias,
      icon: BookOpen,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100/90 dark:bg-purple-950/70',
      glow: 'from-purple-500/20 to-fuchsia-400/5',
    },
    {
      title: t('activeGroups'),
      value: stats.gruposActivos,
      subtitle: `${stats.gruposArchivados} ${t('archivedGroups').toLowerCase()}`,
      icon: Folders,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100/90 dark:bg-green-950/70',
      glow: 'from-emerald-500/20 to-lime-400/5',
    },
    {
      title: t('totalStudents'),
      value: stats.totalEstudiantes,
      icon: UsersRound,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100/90 dark:bg-orange-950/70',
      glow: 'from-orange-500/20 to-amber-400/5',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-muted/35 shadow-[0_26px_58px_-36px_rgba(15,23,42,0.42)] dark:border-border/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80"
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${stat.glow} opacity-70 blur-xl`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl p-2 ${stat.bgColor}`}>
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
