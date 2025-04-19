"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useNavigationWithAuth } from '@/lib/hooks/use-navigation-with-auth';
import { toast } from '@/components/ui/use-toast';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Componente invisible que se encarga de gestionar la sesión de autenticación
 * y refrescar tokens cuando sea necesario
 */
export function AuthSessionRefresh() {
  const router = useRouter();
  const { 
    isInitializing, 
    hasAuthError, 
    hasNetworkError, 
    verifyAuth, 
    refreshSession 
  } = useNavigationWithAuth();
  
  // Verificar tokens caducados al cargar
  useEffect(() => {
    // Comprobar tokens y sesión caducada
    const checkTokens = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener sesión:', error.message);
          toast({
            title: 'Error de sesión',
            description: 'Se produjo un error al verificar tu sesión. Por favor, vuelve a iniciar sesión.',
            variant: 'destructive',
          });
          router.push('/auth/login');
          return;
        }
        
        // Si no hay sesión, redirigir al login
        if (!data.session) {
          router.push('/auth/login');
          return;
        }
        
        // Comprobar si el token está próximo a caducar (menos de 5 minutos)
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const expiryTime = new Date(expiresAt * 1000);
          const timeRemaining = expiryTime.getTime() - Date.now();
          
          // Si quedan menos de 5 minutos, refrescar
          if (timeRemaining < 5 * 60 * 1000) {
            await refreshSession();
          }
        }
      } catch (error) {
        console.error('Error al verificar tokens:', error);
      }
    };
    
    if (!isInitializing) {
      checkTokens();
    }
  }, [isInitializing, refreshSession, router]);
  
  // Efecto para manejar errores de autenticación
  useEffect(() => {
    if (hasAuthError && !isInitializing) {
      toast({
        title: 'Error de autenticación',
        description: 'Tu sesión ha expirado o no es válida. Por favor, vuelve a iniciar sesión.',
        variant: 'destructive',
      });
      router.push('/auth/login');
    }
  }, [hasAuthError, isInitializing, router]);
  
  // Efecto para manejar errores de red
  useEffect(() => {
    if (hasNetworkError && !isInitializing) {
      toast({
        title: 'Error de conexión',
        description: 'No se puede conectar con el servidor. Verifica tu conexión a internet.',
        variant: 'destructive',
      });
    }
  }, [hasNetworkError, isInitializing]);

  // Configurar listener para eventos de auth
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        // Borrar cualquier cache y redirigir al login
        router.push('/auth/login');
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refrescado, verificar autenticación
        verifyAuth();
      }
    });
    
    return () => {
      // Limpiar el listener al desmontar
      authListener.subscription.unsubscribe();
    };
  }, [router, verifyAuth]);

  // Este componente no renderiza nada visible
  return null;
} 