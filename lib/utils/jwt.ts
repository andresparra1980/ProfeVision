import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Extrae el JWT de la sesión actual de Supabase
 *
 * @returns JWT string o null si no hay sesión
 * @throws Error si hay problema al obtener la sesión
 */
export async function getSupabaseJWT(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting Supabase session:", error);
      throw error;
    }

    if (!session) {
      console.warn("No active Supabase session");
      return null;
    }

    return session.access_token;
  } catch (error) {
    console.error("Failed to get Supabase JWT:", error);
    throw error;
  }
}

/**
 * Verifica si el usuario está autenticado (tiene sesión activa)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const jwt = await getSupabaseJWT();
    return jwt !== null;
  } catch {
    return false;
  }
}
