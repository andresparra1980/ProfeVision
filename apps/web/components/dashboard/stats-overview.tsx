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
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: t('totalSubjects'),
      value: stats.totalMaterias,
      icon: BookOpen,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: t('activeGroups'),
      value: stats.gruposActivos,
      subtitle: `${stats.gruposArchivados} ${t('archivedGroups').toLowerCase()}`,
      icon: Folders,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: t('totalStudents'),
      value: stats.totalEstudiantes,
      icon: UsersRound,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
