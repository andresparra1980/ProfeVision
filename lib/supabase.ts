import { supabase as clientSupabase } from "./supabase/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Re-export the client instance
export const supabase = clientSupabase;

// Improved site URL detection with better fallbacks
export const getSiteUrl = () => {
  // Browser context: Use actual origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server context: Use env var with double-checking the URL format
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (
    envUrl &&
    (envUrl.startsWith("http://") || envUrl.startsWith("https://"))
  ) {
    // Remove any trailing slash for consistency
    return envUrl.replace(/\/$/, "");
  }

  // Localhost fallback (only for development)
  return process.env.NODE_ENV === "production"
    ? "https://www.profevision.com" // Production fallback
    : "http://localhost:3000"; // Dev fallback
};

// Get the site URL
export const siteUrl = getSiteUrl();

// For service/admin operations that need the service key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export function getServiceSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// User data type for signup
interface UserSignupData {
  nombre: string;
  apellido: string;
  [key: string]: unknown;
}

// Update sign-up options to include redirectTo
export const signUpWithRedirect = (
  email: string,
  password: string,
  userData: UserSignupData,
  captchaToken?: string
) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${siteUrl}/auth/email-confirmed`,
      captchaToken: captchaToken,
    },
  });
};

// Helper function specifically for password reset
export const resetPassword = (email: string, captchaToken?: string) => {
  // Always recalculate the URL to ensure we have the correct origin
  const currentSiteUrl = getSiteUrl();
  // Use the direct-recovery endpoint specifically
  const resetRedirectUrl = `${currentSiteUrl}/auth/direct-recovery`;

  // Make sure we're using the correct URL format
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetRedirectUrl,
    captchaToken,
  });
};
