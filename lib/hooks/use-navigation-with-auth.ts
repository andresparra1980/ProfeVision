"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationEvents } from '@/lib/providers/navigation-events-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook que combina el sistema de navegación con verificación de autenticación
 */
export function useNavigationWithAuth() {
  const router = useRouter();
  const { navigationState, resetCache, checkConnection, checkAuthentication } = useNavigationEvents();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado derivado
  const hasNetworkError = navigationState.networkError;
  const hasAuthError = navigationState.authError;
  
  /**
   * Función para refrescar la sesión
   */
  const refreshSession = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Intentar refrescar el token
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        // Si hay error al refrescar, mostrar notificación
        console.error('Error al refrescar sesión:', error);
        toast({
          title: 'Error de sesión',
          description: 'No se pudo refrescar tu sesión. Por favor, vuelve a iniciar sesión.',
          variant: 'destructive',
        });
        
        // Redirigir al login
        router.push('/auth/login');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al refrescar sesión:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);
  
  /**
   * Función para verificar autenticación del cliente
   */
  const verifyAuth = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      
      // Verificar la sesión de Supabase del lado del cliente
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        // Si hay error o no hay sesión, redirigir al login
        router.push('/auth/login');
        return false;
      }
      
      // Verificar si el token está por expirar (menos de 5 minutos)
      const expiresAt = data.session?.expires_at;
      const isExpiring = expiresAt && new Date(expiresAt * 1000).getTime() - Date.now() < 5 * 60 * 1000;
      
      // Si está por expirar, intentar refrescar el token
      if (isExpiring) {
        await refreshSession();
      }
      
      // Verificar también con el servidor
      await checkAuthentication();
      
      return true;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [router, refreshSession, checkAuthentication]);
  
  /**
   * Efecto para verificar autenticación al inicio
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar conectividad primero
        const hasConnection = await checkConnection();
        
        if (!hasConnection) {
          toast({
            title: 'Error de conexión',
            description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            variant: 'destructive',
          });
          return;
        }
        
        // Verificar autenticación
        await verifyAuth();
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, [checkConnection, verifyAuth]);
  
  /**
   * Efecto para verificar autenticación después de cambios de ruta
   */
  useEffect(() => {
    if (!isInitializing && navigationState.lastNavigationTime > 0 && !navigationState.isNavigating) {
      // Verificar conectividad y autenticación después de cada navegación completa
      checkConnection();
      verifyAuth();
    }
  }, [navigationState.lastNavigationTime, navigationState.isNavigating, isInitializing, checkConnection, verifyAuth]);

  return {
    navigationState,
    isInitializing,
    isAuthenticating,
    isRefreshing,
    hasNetworkError,
    hasAuthError,
    verifyAuth,
    refreshSession,
    resetCache,
    checkConnection,
  };
} 