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
import { BillingPeriodToggle, BillingPeriod } from "./billing-period-toggle";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [completing, setCompleting] = useState(false);

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
        toast.error("Error al completar bienvenida");
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
      toast.error("Error al completar bienvenida");
    } finally {
      setCompleting(false);
    }
  };

  const handleUpgrade = () => {
    toast.info("Próximamente disponible", {
      description:
        "La funcionalidad de pago estará disponible pronto. ¡Mantente atento!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl">
            ¡Bienvenido a ProfeVision!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Elige el plan que mejor se adapte a tus necesidades. Puedes
            actualizar en cualquier momento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Toggle de periodo de facturación */}
          <BillingPeriodToggle
            period={billingPeriod}
            onChange={setBillingPeriod}
          />

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
                ? "Configurando tu cuenta..."
                : "Continuar con el plan Free"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Puedes actualizar a Plus en cualquier momento desde tu perfil
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
