import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient();
  }
  return supabaseClient;
}; 