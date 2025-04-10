import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';

// Cliente de supabase para el servidor
export const createClient = (): SupabaseClient => {
  const cookieStore = cookies();
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error: unknown) {
            // No se pueden establecer cookies después de que se haya enviado la respuesta
            if (DEBUG) {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error: unknown) {
            // No se pueden eliminar cookies después de que se haya enviado la respuesta
            if (DEBUG) {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    }
  );
};

// Cliente de supabase con permisos de admin para el servidor
export const createAdminSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Faltan variables de entorno de Supabase para el cliente admin');
  }
  
  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default createClient; 