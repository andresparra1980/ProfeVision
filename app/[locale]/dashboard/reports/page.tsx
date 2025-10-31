"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge, SubscriptionTier } from "@/components/shared/tier-badge";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { PricingCard } from "@/components/shared/pricing-card";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { AlertTriangle, Calendar, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function SubscriptionPage() {
  const t = useTranslations('dashboard.subscription');
  const { usage, loading } = useTierLimits();

  const handleUpgrade = () => {
    toast.info("Próximamente disponible", {
      description: "La funcionalidad de pago estará disponible pronto. ¡Mantente atento!",
    });
  };

  if (loading) {
    return <LoadingSpinner message={t('loading', { defaultValue: 'Cargando información de suscripción...' })} />;
  }

  if (!usage) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('error', { defaultValue: 'No se pudo cargar la información de suscripción' })}</p>
      </div>
    );
  }

  const isGrandfathered = usage.tier.name === "grandfathered";
  const currentTier = usage.tier.name as SubscriptionTier;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('title', { defaultValue: 'Mi Plan' })}
          </h2>
          <p className="text-muted-foreground">
            {t('description', { defaultValue: 'Gestiona tu suscripción y revisa tu uso actual' })}
          </p>
        </div>
        <TierBadge tier={currentTier} size="lg" />
      </div>

      {/* Warning para usuarios grandfathered */}
      {isGrandfathered && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {t('grandfathered.title', { defaultValue: 'Plan Legacy Temporal' })}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {t('grandfathered.description', {
              defaultValue: 'Como usuario existente, tienes acceso ilimitado temporalmente. Este plan legacy será reemplazado eventualmente por un plan estándar. Te notificaremos con anticipación sobre cualquier cambio.'
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Uso Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('usage.title', { defaultValue: 'Uso Actual' })}
          </CardTitle>
          <CardDescription>
            {t('usage.description', {
              defaultValue: 'Tu ciclo se renueva el'
            })} {new Date(usage.cycle.end).toLocaleDateString('es', {
              day: 'numeric',
              month: 'long'
            })} ({usage.cycle.daysUntilReset} {usage.cycle.daysUntilReset === 1 ? t('usage.day', { defaultValue: 'día' }) : t('usage.days', { defaultValue: 'días' })})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageIndicator
            label={t('usage.aiGenerations', { defaultValue: 'Generaciones con IA' })}
            used={usage.ai_generation.used}
            limit={usage.ai_generation.limit}
          />
          <UsageIndicator
            label={t('usage.scans', { defaultValue: 'Escaneos de exámenes' })}
            used={usage.scans.used}
            limit={usage.scans.limit}
          />
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      {!isGrandfathered && (
        <div>
          <h3 className="text-2xl font-bold mb-4">
            {t('plans.title', { defaultValue: 'Planes Disponibles' })}
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
            {t('faq.title', { defaultValue: 'Preguntas Frecuentes' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">
              {t('faq.q1.question', { defaultValue: '¿Qué sucede si alcanzo mi límite mensual?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('faq.q1.answer', {
                defaultValue: 'Si alcanzas tu límite mensual, no podrás usar esa función hasta que se renueve tu ciclo. Puedes actualizar a Plus para obtener acceso ilimitado.'
              })}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">
              {t('faq.q2.question', { defaultValue: '¿Cuándo se renueva mi límite mensual?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('faq.q2.answer', {
                defaultValue: 'Tu límite se renueva automáticamente cada mes en la fecha de inicio de tu ciclo de facturación.'
              })}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">
              {t('faq.q3.question', { defaultValue: '¿Puedo cancelar mi suscripción en cualquier momento?' })}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('faq.q3.answer', {
                defaultValue: 'Sí, puedes cancelar tu suscripción en cualquier momento. Mantendrás acceso a las funciones premium hasta el final de tu periodo de facturación actual.'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
