'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import type { AdminStats } from '@/lib/hooks/use-admin-stats';

interface AdminTierDistributionProps {
  stats: AdminStats;
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-500',
  plus: 'bg-blue-500',
  admin: 'bg-purple-500',
  grandfathered: 'bg-amber-500',
};

export function AdminTierDistribution({ stats }: AdminTierDistributionProps) {
  const t = useTranslations('dashboard.admin.tiers');
  const tStats = useTranslations('dashboard.admin.stats');

  const tierLabels: Record<string, string> = {
    free: t('free'),
    plus: t('plus'),
    admin: t('admin'),
    grandfathered: t('grandfathered'),
  };

  const tiers = Object.entries(stats.users.by_tier).map(([tier, count]) => ({
    tier,
    count,
    percentage: stats.users.total > 0 ? (count / stats.users.total) * 100 : 0,
  }));

  const total = stats.users.total;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tiers.map(({ tier, count, percentage }) => (
          <div key={tier} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{tierLabels[tier] || tier}</span>
              <span className="text-muted-foreground">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${tierColors[tier] || 'bg-gray-400'} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{tStats('totalUsers')}</span>
            <span>{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
