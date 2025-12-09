import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface DashboardStats {
  totalInstituciones: number;
  totalMaterias: number;
  gruposActivos: number;
  gruposArchivados: number;
  totalEstudiantes: number;
  examenesRecientes: Array<{
    id: string;
    titulo: string;
    estado: string;
    fecha_creacion: string;
    materia_nombre: string | null;
    grupos_nombres: string[];
  }>;
  examenesCalificados: number;
  tiempoAhorradoSegundos: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const routerRef = useRef(router);

  // Mantener router actualizado en ref para evitar dependencias
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener sesión para el token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.error(
          "[useDashboardStats] Error getting session:",
          sessionError
        );
        throw sessionError;
      }

      if (!session) {
        logger.log(
          "[useDashboardStats] No session found, redirecting to login"
        );
        routerRef.current.push("/auth/login");
        return;
      }

      // Hacer petición al API endpoint
      const response = await fetch("/api/dashboard/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        logger.log("[useDashboardStats] Unauthorized, redirecting to login");
        routerRef.current.push("/auth/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener estadísticas");
      }

      const data = await response.json();
      logger.log("[useDashboardStats] Stats fetched successfully");
      setStats(data);
    } catch (err: unknown) {
      const errorObj = err as Error;
      logger.error("[useDashboardStats] Error fetching stats:", {
        message: errorObj.message,
        errorObject: errorObj,
      });
      setError(errorObj);

      toast.error("Error al cargar estadísticas", {
        description: errorObj.message,
      });
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias - usa routerRef

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
