'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  dashboardCardClassName,
  dashboardInsetCardClassName,
} from '@/components/ui/card';
import { TrendingUp, Zap, ScanLine, Calendar } from 'lucide-react';
import { useTierLimits } from '@/lib/hooks/useTierLimits';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { TierBadge, SubscriptionTier } from '@/components/shared/tier-badge';
import { UsageIndicator } from '@/components/shared/usage-indicator';

export function TierUsageStats() {
  const { usage, loading } = useTierLimits();
  const t = useTranslations('tiers');
  const tDashboard = useTranslations('dashboard.tierUsage');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const currentTier = usage.tier.name as SubscriptionTier;
  const isUnlimited = usage.tier.name === 'grandfathered' ||
                      usage.tier.name === 'plus' ||
                      usage.tier.name === 'admin';

  return (
    <Card className={dashboardCardClassName}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-600 dark:text-cyan-300 shrink-0" />
            <span className="break-words">{tDashboard('title', { defaultValue: 'Plan Usage' })}</span>
          </div>
          <TierBadge tier={currentTier} size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Generations */}
        <div className={dashboardInsetCardClassName + " bg-gradient-to-br from-amber-50/80 via-background to-background dark:from-amber-500/8 dark:via-transparent dark:to-transparent p-4"}>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            {t('features.ai_generations')}
          </p>
          {isUnlimited ? (
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-300">
              {t('usage.unlimited')}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                {usage.ai_generation.used} / {usage.ai_generation.limit}
              </div>
              <UsageIndicator
                label=""
                used={usage.ai_generation.used}
                limit={usage.ai_generation.limit}
                hideLabel
              />
            </div>
          )}
        </div>

        {/* Exam Scans */}
        <div className={dashboardInsetCardClassName + " bg-gradient-to-br from-sky-50/80 via-background to-background dark:from-sky-500/8 dark:via-transparent dark:to-transparent p-4"}>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-sky-600 dark:text-sky-300" />
            {t('features.scans')}
          </p>
          {isUnlimited ? (
            <div className="text-3xl font-bold text-sky-600 dark:text-sky-300">
              {t('usage.unlimited')}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                {usage.scans.used} / {usage.scans.limit}
              </div>
              <UsageIndicator
                label=""
                used={usage.scans.used}
                limit={usage.scans.limit}
                hideLabel
              />
            </div>
          )}
        </div>

        {/* Cycle Reset */}
        <div className={dashboardInsetCardClassName + " bg-gradient-to-br from-emerald-50/55 via-background to-background dark:from-emerald-500/6 dark:via-transparent dark:to-transparent p-4"}>
          <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
              {tDashboard('cycleReset', { defaultValue: 'Cycle resets in' })}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-300 text-right">
              {usage.cycle.daysUntilReset} {usage.cycle.daysUntilReset === 1
                ? tDashboard('day', { defaultValue: 'day' })
                : tDashboard('days', { defaultValue: 'days' })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
