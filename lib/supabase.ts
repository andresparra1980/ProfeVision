import { supabase as clientSupabase } from './supabase/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

// Re-export the client instance
export const supabase = clientSupabase;

// Define site URL for callbacks
export const siteUrl = 
  typeof window !== 'undefined' 
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// For service/admin operations that need the service key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export function getServiceSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Update sign-up options to include redirectTo
export const signUpWithRedirect = (email: string, password: string, userData: any, captchaToken?: string) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${siteUrl}/auth/callback`,
      captchaToken: captchaToken,
    },
  });
}; 