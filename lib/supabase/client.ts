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
  });

  return client;
}

// Export a single instance of the client
export const supabase = getSupabaseClient(); 