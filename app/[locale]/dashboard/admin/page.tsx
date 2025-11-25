'use client';

import { useTranslations } from 'next-intl';
import { useAdminStats } from '@/lib/hooks/use-admin-stats';
import { AdminStatsOverview } from '@/components/admin/admin-stats-overview';
import { AdminTierDistribution } from '@/components/admin/admin-tier-distribution';
import { AdminTrendsChart } from '@/components/admin/admin-trends-chart';
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard.admin');
  const { stats, loading, error, refetch } = useAdminStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <TitleCardWithDepth
          title={t('title')}
          description={t('loading')}
          icon={<Shield className="h-6 w-6 text-purple-600" />}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TitleCardWithDepth
          title={t('title')}
          description={t('errorLoading')}
          icon={<Shield className="h-6 w-6 text-purple-600" />}
        />
        <Card>
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <TitleCardWithDepth
          title={t('title')}
          description={t('description')}
          icon={<Shield className="h-6 w-6 text-purple-600" />}
        />
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          <Link href="/dashboard/admin/users">
            <Button size="sm">
              <Users className="h-4 w-4 mr-2" />
              {t('viewUsers')}
            </Button>
          </Link>
        </div>
      </div>

      <AdminStatsOverview stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminTrendsChart stats={stats} />
        </div>
        <AdminTierDistribution stats={stats} />
      </div>
    </div>
  );
}
