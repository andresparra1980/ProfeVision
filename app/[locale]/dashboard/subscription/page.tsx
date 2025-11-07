"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge, SubscriptionTier } from "@/components/shared/tier-badge";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { PricingCard } from "@/components/shared/pricing-card";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { SubscriptionPageSkeleton } from "./components/SubscriptionPageSkeleton";
import { AlertTriangle, Calendar, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

export default function SubscriptionPage() {
  const t = useTranslations('tiers');
  const locale = useLocale();
  const { usage, loading } = useTierLimits();

  const handleUpgrade = () => {
    toast.info(t("pricing.comingSoon", { defaultValue: "Coming Soon" }), {
      description: t("pricing.comingSoonDesc", { defaultValue: "Payment functionality will be available soon. Stay tuned!" }),
    });
  };

  const isGrandfathered = usage?.tier.name === "grandfathered";
  const currentTier = (usage?.tier.name || "free") as SubscriptionTier;

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('subscription.title', { defaultValue: 'My Plan' })}
          </h2>
          <p className="text-muted-foreground">
            {t('subscription.description', { defaultValue: 'Manage your subscription and review your current usage' })}
          </p>
        </div>
        <TierBadge tier={currentTier} size="lg" />
      </div>

      {loading ? (
        <SubscriptionPageSkeleton />
      ) : !usage ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{t('subscription.error', { defaultValue: 'Could not load subscription information' })}</p>
        </div>
      ) : (
        <>

      {/* Warning para usuarios grandfathered */}
      {isGrandfathered && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {t('subscription.grandfathered.title', { defaultValue: 'Temporary Legacy Plan' })}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {t('subscription.grandfathered.description', {
              defaultValue: 'As an existing user, you have unlimited access temporarily. This legacy plan will eventually be replaced by a standard plan. We will notify you in advance about any changes.'
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Uso Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('subscription.usage.title', { defaultValue: 'Current Usage' })}
          </CardTitle>
          <CardDescription>
            {t('subscription.usage.description', {
              defaultValue: 'Your cycle renews on the'
            })} {new Date(usage.cycle.end).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long'
            })} ({usage.cycle.daysUntilReset} {usage.cycle.daysUntilReset === 1 ? t('subscription.usage.day', { defaultValue: 'day' }) : t('subscription.usage.days', { defaultValue: 'days' })})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageIndicator
            label={t('subscription.usage.aiGenerations', { defaultValue: 'AI Generations' })}
            used={usage.ai_generation.used}
            limit={usage.ai_generation.limit}
          />
          <UsageIndicator
            label={t('subscription.usage.scans', { defaultValue: 'Exam Scans' })}
            used={usage.scans.used}
            limit={usage.scans.limit}
          />
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      {!isGrandfathered && (
        <div>
          <h3 className="text-2xl font-bold mb-4">
            {t('subscription.plans.title', { defaultValue: 'Available Plans' })}
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <PricingCard
              tier="free"
              isCurrentPlan={currentTier === "free"}
              onUpgrade={handleUpgrade}
            />
            <PricingCard
              tier="plus"
              isCurrentPlan={currentTier === "plus"}
              onUpgrade={handleUpgrade}
            />
          </div>
        </div>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('subscription.faq.title', { defaultValue: 'Frequently Asked Questions' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">
              {t('subscription.faq.q1.question', { defaultValue: 'What happens if I reach my monthly limit?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('subscription.faq.q1.answer', {
                defaultValue: 'If you reach your monthly limit, you won\'t be able to use that feature until your cycle renews. You can upgrade to Plus to get unlimited access.'
              })}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">
              {t('subscription.faq.q2.question', { defaultValue: 'When does my monthly limit renew?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('subscription.faq.q2.answer', {
                defaultValue: 'Your limit renews automatically every month on your billing cycle start date.'
              })}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">
              {t('subscription.faq.q3.question', { defaultValue: 'Can I cancel my subscription at any time?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('subscription.faq.q3.answer', {
                defaultValue: 'Yes, you can cancel your subscription at any time. You will maintain access to premium features until the end of your current billing period.'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
