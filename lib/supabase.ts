import { supabase as clientSupabase } from "./supabase/client";

// Re-export the client instance for browser use
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
  captchaToken?: string,
  locale?: 'es' | 'en'
) => {
  const currentSiteUrl = getSiteUrl();
  const query = new URLSearchParams();
  if (locale) query.set('locale', locale);
  // Use a conservative param name that providers won't strip
  query.set('pv', 'signup');
  const callbackUrl = `${currentSiteUrl}/auth/callback?${query.toString()}`;
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      // Always redirect back to the centralized auth callback so it can
      // decide the proper localized destination (en/es) consistently.
      emailRedirectTo: callbackUrl,
      captchaToken: captchaToken,
    },
  });
};

// Helper function specifically for password reset
export const resetPassword = (email: string, captchaToken?: string, locale?: 'es' | 'en') => {
  // Always recalculate the URL to ensure we have the correct origin
  const currentSiteUrl = getSiteUrl();
  // Use the direct-recovery endpoint specifically
  const resetRedirectUrl = `${currentSiteUrl}/auth/direct-recovery${locale ? `?locale=${locale}` : ''}`;

  // Make sure we're using the correct URL format
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetRedirectUrl,
    captchaToken,
  });
};
