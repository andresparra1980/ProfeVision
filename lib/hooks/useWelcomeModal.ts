import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkWelcomeStatus = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener sesión
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.error("[useWelcomeModal] Error getting session:", sessionError);
        return;
      }

      if (!session) {
        logger.log("[useWelcomeModal] No session found");
        return;
      }

      // Llamar al API para verificar
      const response = await fetch("/api/tiers/check-welcome", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("[useWelcomeModal] Error checking welcome status", { status: response.status, ...errorData });
        return;
      }

      const data = await response.json();
      setShowWelcome(data.showWelcome);
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error("[useWelcomeModal] Error checking welcome status", errorObj?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkWelcomeStatus();
  }, [checkWelcomeStatus]);

  return {
    showWelcome,
    setShowWelcome,
    loading,
  };
}
