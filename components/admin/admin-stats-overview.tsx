'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, ScanLine, Building2, Folders, GraduationCap, Bot } from 'lucide-react';
import type { AdminStats } from '@/lib/hooks/use-admin-stats';

interface AdminStatsOverviewProps {
  stats: AdminStats;
}

export function AdminStatsOverview({ stats }: AdminStatsOverviewProps) {
  const t = useTranslations('dashboard.admin.stats');

  const cards = [
    {
      title: t('totalUsers'),
      value: stats.users.total,
      subtext: `+${stats.users.new_this_month} ${t('newThisMonth')}`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: t('totalExams'),
      value: stats.exams.total,
      subtext: `${stats.exams.with_results} ${t('withResults')}`,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: t('totalScans'),
      value: stats.scans.total,
      subtext: `+${stats.scans.this_month} ${t('scansThisMonth')}`,
      icon: ScanLine,
      color: 'text-purple-600',
    },
    {
      title: t('institutions'),
      value: stats.institutions.total,
      subtext: '',
      icon: Building2,
      color: 'text-orange-600',
    },
    {
      title: t('groups'),
      value: stats.groups.total,
      subtext: `${stats.groups.active} ${t('active')}`,
      icon: Folders,
      color: 'text-cyan-600',
    },
    {
      title: t('students'),
      value: stats.students.total,
      subtext: '',
      icon: GraduationCap,
      color: 'text-pink-600',
    },
    {
      title: 'Jobs IA',
      value: stats.ai_jobs.total,
      subtext: `${stats.ai_jobs.completed} OK`,
      icon: Bot,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            {card.subtext && (
              <p className="text-xs text-muted-foreground">{card.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
