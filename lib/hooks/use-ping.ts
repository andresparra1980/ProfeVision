import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Hook para mantener activa la conexión a Supabase en componentes que requieren 
 * mantener la sesión viva durante períodos de inactividad
 * @param intervalMs Intervalo en milisegundos entre pings (por defecto 2 minutos)
 * @returns void
 */
export function usePing(intervalMs = 2 * 60 * 1000) {
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función de ping para mantener la conexión activa
  const pingActivity = async () => {
    try {
      // Llamada al endpoint de ping
      const pingResponse = await fetch('/api/ping', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Ping-Time': new Date().toISOString()
        }
      });

      if (!pingResponse.ok) {
        console.warn('Advertencia: Error en ping API');
      }
      
      // También obtener la sesión para mantenerla activa
      await supabase.auth.getSession();
      
      console.log('Ping de actividad ejecutado desde hook:', new Date().toISOString());
    } catch (error) {
      console.error('Error en ping de actividad:', error);
    }
  };

  useEffect(() => {
    // Iniciar el ping periódico
    pingIntervalRef.current = setInterval(pingActivity, intervalMs);
    
    // Hacer un ping inicial inmediatamente
    pingActivity();

    // Limpiar el intervalo al desmontar el componente
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [intervalMs]); // Solo se ejecuta al montar/desmontar y si cambia el intervalo
} 