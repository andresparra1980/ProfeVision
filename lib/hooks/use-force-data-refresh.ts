"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigationEvents } from '@/lib/providers/navigation-events-provider';

interface UseForceDataRefreshOptions {
  /** Intervalo mínimo entre recargas en milisegundos */
  minInterval?: number;
  /** Recargar automáticamente en cada navegación */
  reloadOnNavigation?: boolean;
}

/**
 * Hook para forzar la recarga de datos en componentes, evitando problemas
 * de caché durante la navegación entre páginas.
 * 
 * @param options Opciones de configuración del hook
 * @returns Un objeto con estado de recarga y funciones de control
 */
export function useForceDataRefresh(options: UseForceDataRefreshOptions = {}) {
  const { minInterval = 2000, reloadOnNavigation = true } = options;
  
  // Obtener el contexto de eventos de navegación
  const { navigationState, resetCache } = useNavigationEvents();
  
  // Estado para controlar actualizaciones
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshTime = useRef(0);

  // Función para forzar recarga de datos
  const forceRefresh = useCallback(() => {
    const now = Date.now();
    
    // Verificar si ha pasado suficiente tiempo desde la última recarga
    if (now - lastRefreshTime.current > minInterval) {
      lastRefreshTime.current = now;
      setIsRefreshing(true);
      
      // Incrementar el contador para forzar useEffect a ejecutarse
      setRefreshTrigger(prev => prev + 1);
      
      // Notificar al provider para limpiar caché global si es necesario
      resetCache();
      
      // Reiniciar el estado de recarga después de un pequeño delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 200);
    }
  }, [minInterval, resetCache]);

  // Efecto para detectar cambios de navegación
  useEffect(() => {
    if (reloadOnNavigation && navigationState.lastNavigationTime > 0) {
      // Usar un timeout para asegurarse de que la navegación ha completado
      const timeout = setTimeout(() => {
        forceRefresh();
      }, 100);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [reloadOnNavigation, navigationState.lastNavigationTime, forceRefresh]);

  return {
    refreshTrigger,
    isRefreshing,
    forceRefresh,
    lastNavigationTime: navigationState.lastNavigationTime
  };
} 