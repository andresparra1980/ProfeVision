import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key must be defined in environment variables');
}

// Define site URL for callbacks
const siteUrl = 
  typeof window !== 'undefined' 
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Client-side Supabase client with auth configuration
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
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

// Update sign-up options to include redirectTo
export const signUpWithRedirect = (email: string, password: string, userData: any) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
};

// Service role client for server-side operations
export const getServiceSupabase = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Supabase service role key must be defined in environment variables for admin operations');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}; 