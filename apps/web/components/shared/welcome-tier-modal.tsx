"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PricingCardV2 } from "./pricing-card-v2";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { logoFont } from "@/lib/fonts";
import { LanguageSwitcherDropdownSuspense } from "./language-switcher-dropdown";

interface WelcomeTierModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onComplete: () => void;
}

export function WelcomeTierModal({
  open,
  onOpenChange,
  onComplete,
}: WelcomeTierModalProps) {
  const t = useTranslations("tiers");
  const [completing, setCompleting] = useState(false);
  const billingPeriod = "monthly";

  const handleContinueFree = async () => {
    try {
      setCompleting(true);

      // Obtener sesión
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.error(
          "[WelcomeTierModal] Error getting session:",
          sessionError
        );
        toast.error(t("welcome.successDesc", { defaultValue: "Error completing welcome" }));
        return;
      }

      // Llamar al API para marcar como completado
      const response = await fetch("/api/tiers/complete-welcome", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al completar bienvenida");
      }

      logger.log("[WelcomeTierModal] Welcome completed successfully");
      onComplete();
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error("[WelcomeTierModal] Error:", errorObj);
      toast.error(t("welcome.successDesc", { defaultValue: "Error completing welcome" }));
    } finally {
      setCompleting(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      // Obtener email del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Error", { description: "No se pudo obtener tu email" });
        return;
      }

      // Primero completar el welcome (marcar first_login_completed = true)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/tiers/complete-welcome", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });
      }

      // Redirigir al checkout de Polar
      const productId = billingPeriod === "monthly" 
        ? process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_MONTHLY
        : process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ANNUAL;
      
      const checkoutUrl = `/api/polar/checkout?products=${productId}&customerEmail=${encodeURIComponent(user.email)}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      logger.error("[WelcomeTierModal] Error initiating checkout:", error);
      toast.error("Error", { description: "No se pudo iniciar el checkout" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcherDropdownSuspense variant="outline" size="sm" withTooltip tooltipSide="left" />
        </div>
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className={`text-3xl ${logoFont}`}>
            {t("welcome.title", { defaultValue: "Welcome to ProfeVision!" })}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {t("welcome.description", { defaultValue: "Choose the plan that best fits your needs. You can upgrade at any time." })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Pricing Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <PricingCardV2
              tier="free"
              billingPeriod={billingPeriod}
              compact
              onUpgrade={handleContinueFree}
            />
            <PricingCardV2
              tier="plus"
              billingPeriod={billingPeriod}
              compact
              onUpgrade={handleUpgrade}
            />
          </div>

          {/* Botón de continuar con Free */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleContinueFree}
              disabled={completing}
              className="text-muted-foreground hover:text-foreground"
            >
              {completing
                ? t("welcome.configuringAccount", { defaultValue: "Setting up your account..." })
                : t("welcome.continueFree", { defaultValue: "Continue with Free plan" })}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("welcome.upgradeAnytime", { defaultValue: "You can upgrade to Plus at any time from your profile" })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
