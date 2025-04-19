import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

// Singleton instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Function to get Supabase client
export function getSupabaseClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      fetch: fetch.bind(globalThis),
      headers: {
        'X-Client-Info': 'profevision',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  });

  return client;
}

// Export a single instance of the client
export const supabase = getSupabaseClient();

// Keep-alive function to prevent connections from going stale
export function setupKeepAlive() {
  if (typeof window !== 'undefined') {
    // Use Realtime subscription to keep the connection alive
    // This es más eficiente que hacer consultas periódicas
    const channel = supabase.channel('keep-alive');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        // La presencia mantiene una conexión activa
        // No necesitamos hacer nada específico con el evento
      })
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status !== 'SUBSCRIBED') {
          // Si la suscripción falla por alguna razón, intentamos reconectar
          setTimeout(() => {
            channel.unsubscribe();
            setupKeepAlive();
          }, 5000);
        }
      });
      
    // También establecemos un ping periódico de respaldo en caso de que
    // el canal de Realtime no sea suficiente
    const pingSupabase = async () => {
      try {
        // Verificar el estado de la sesión (operación liviana)
        await supabase.auth.getSession();
      } catch (error) {
        // Silent fail
      }
    };

    // Ping cada 4 minutos como respaldo
    const intervalId = setInterval(pingSupabase, 4 * 60 * 1000);

    // Limpieza al salir de la página
    window.addEventListener('beforeunload', () => {
      channel.unsubscribe();
      clearInterval(intervalId);
    });

    return () => {
      channel.unsubscribe();
      clearInterval(intervalId);
    };
  }
  
  return null;
} 