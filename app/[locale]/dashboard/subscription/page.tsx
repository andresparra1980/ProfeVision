"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge, SubscriptionTier } from "@/components/shared/tier-badge";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { PricingCard } from "@/components/shared/pricing-card";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { SubscriptionPageSkeleton } from "./components/SubscriptionPageSkeleton";
import { AlertTriangle, Calendar, HelpCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations, useLocale } from "next-intl";
import { TitleCardWithDepth } from "@/components/shared/title-card-with-depth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export default function SubscriptionPage() {
  const t = useTranslations('tiers');
  const locale = useLocale();
  const { usage, loading, refetch } = useTierLimits();
  const searchParams = useSearchParams();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Obtener email del usuario para el checkout
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Mostrar toast si viene de un upgrade exitoso
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success(t("pricing.upgradeSuccess", { defaultValue: "Welcome to Plus!" }), {
        description: t("pricing.upgradeSuccessDesc", { defaultValue: "Your subscription has been activated. Enjoy unlimited features!" }),
      });
      // Refrescar datos de uso
      refetch();
      // Limpiar URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, t, refetch]);

  const handleUpgrade = () => {
    if (!userEmail) {
      toast.error("Error", { description: "No se pudo obtener tu email" });
      return;
    }
    
    // Redirigir al checkout de Polar con el producto mensual
    const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_MONTHLY;
    const checkoutUrl = `/api/polar/checkout?products=${productId}&customerEmail=${encodeURIComponent(userEmail)}`;
    window.location.href = checkoutUrl;
  };

  const handleManageSubscription = () => {
    // Redirigir al portal de cliente de Polar
    window.location.href = "/api/polar/portal";
  };

  const isGrandfathered = usage?.tier.name === "grandfathered";
  const currentTier = (usage?.tier.name || "free") as SubscriptionTier;
  const isCancelled = usage?.subscription_status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      <TitleCardWithDepth
        title={t('subscription.title', { defaultValue: 'My Plan' })}
        description={t('subscription.description', { defaultValue: 'Manage your subscription and review your current usage' })}
        actions={
          loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <TierBadge tier={currentTier} size="lg" />
          )
        }
      />

      {loading ? (
        <SubscriptionPageSkeleton />
      ) : !usage ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{t('subscription.error', { defaultValue: 'Could not load subscription information' })}</p>
        </div>
      ) : (
        <>

      {/* Aviso de suscripción cancelada */}
      {isCancelled && currentTier === "plus" && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            {t('subscription.cancelled.title', { defaultValue: 'Subscription Cancelled' })}
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {t('subscription.cancelled.description', {
              defaultValue: 'Your subscription has been cancelled. You will maintain access to Plus features until'
            })} {new Date(usage.cycle.end).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón gestionar suscripción para usuarios Plus */}
      {currentTier === "plus" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('subscription.manage.title', { defaultValue: 'Manage Subscription' })}
            </CardTitle>
            <CardDescription>
              {isCancelled 
                ? t('subscription.manage.descriptionCancelled', { defaultValue: 'View invoices or reactivate your subscription' })
                : t('subscription.manage.description', { defaultValue: 'View invoices, update payment method, or cancel your subscription' })
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleManageSubscription} variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {t('subscription.manage.button', { defaultValue: 'Go to Customer Portal' })}
            </Button>
          </CardContent>
        </Card>
      )}

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
          {/* Solo mostrar ciclo de renovación para planes de pago */}
          {(currentTier === "plus" || currentTier === "admin") && (
            <CardDescription>
              {t('subscription.usage.description', {
                defaultValue: 'Your cycle renews on the'
              })} {new Date(usage.cycle.end).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'long'
              })} ({usage.cycle.daysUntilReset} {usage.cycle.daysUntilReset === 1 ? t('subscription.usage.day', { defaultValue: 'day' }) : t('subscription.usage.days', { defaultValue: 'days' })})
            </CardDescription>
          )}
          {currentTier === "free" && (
            <CardDescription>
              {t('subscription.usage.freeDescription', {
                defaultValue: 'Your monthly usage limits reset automatically each month'
              })}
            </CardDescription>
          )}
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
              isDowngrade={currentTier === "plus"}
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
