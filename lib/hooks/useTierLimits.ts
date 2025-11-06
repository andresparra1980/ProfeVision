import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface UsageData {
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
}

export interface TierUsageStats {
  tier: {
    name: string;
    display_name: string;
  };
  ai_generation: UsageData;
  scans: UsageData;
  cycle: {
    start: string;
    end: string;
    daysUntilReset: number;
  };
}

export function useTierLimits() {
  const [usage, setUsage] = useState<TierUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const routerRef = useRef(router);

  // Mantener router actualizado en ref para evitar dependencias
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener sesión para el token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.error("[useTierLimits] Error getting session:", sessionError);
        throw sessionError;
      }

      if (!session) {
        logger.log("[useTierLimits] No session found, redirecting to login");
        routerRef.current.push("/auth/login");
        return;
      }

      // Hacer petición al API endpoint
      const response = await fetch("/api/tiers/usage", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        logger.log("[useTierLimits] Unauthorized, redirecting to login");
        routerRef.current.push("/auth/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al obtener estadísticas de uso"
        );
      }

      const data = await response.json();
      logger.log("[useTierLimits] Usage stats fetched successfully");
      setUsage(data);
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error("[useTierLimits] Error fetching usage:", {
        message: errorObj.message,
        errorObject: errorObj,
      });
      setError(errorObj);

      toast.error("Error al cargar información de uso", {
        description: errorObj.message,
      });
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias - usa routerRef

  useEffect(() => {
    // Fetch inicial
    fetchUsage();

    // Refresh cuando el usuario vuelve al tab (más eficiente que polling)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.log("[useTierLimits] Tab visible, refreshing usage stats");
        fetchUsage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUsage]);

  const refetch = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  const canUseScan = useCallback(() => {
    if (!usage) return false;

    // Si el límite es -1, es ilimitado
    if (usage.scans.limit === -1) return true;

    // Verificar si aún hay escaneos disponibles
    return usage.scans.used < usage.scans.limit;
  }, [usage]);

  const canUseAI = useCallback(() => {
    if (!usage) return false;

    // Si el límite es -1, es ilimitado
    if (usage.ai_generation.limit === -1) return true;

    // Verificar si aún hay generaciones disponibles
    return usage.ai_generation.used < usage.ai_generation.limit;
  }, [usage]);

  return {
    usage,
    loading,
    error,
    refetch,
    canUseScan,
    canUseAI,
  };
}
