import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/utils/logger";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  };
  profesor: {
    id: string;
  };
}

/**
 * Verifies that the request has a valid authorization token
 * and that the user is a registered teacher (profesor)
 * @throws Error if authentication fails
 */
export async function verifyTeacherAuth(
  req: NextRequest
): Promise<AuthResult> {
  // 1) Check authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    logger.auth("Missing Authorization header");
    throw new Error("NO_AUTH_HEADER");
  }

  // 2) Check Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("Supabase config missing");
    throw new Error("SUPABASE_CONFIG_MISSING");
  }

  // 3) Verify user with Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const jwt = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(jwt);

  if (userError || !user) {
    logger.auth("Usuario no autenticado", { userError: !!userError });
    throw new Error("USER_NOT_AUTHENTICATED");
  }

  // 4) Verify user is a teacher
  const { data: profesor } = await supabase
    .from("profesores")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profesor) {
    logger.auth("Usuario no es profesor", { userId: user.id });
    throw new Error("USER_NOT_TEACHER");
  }

  return { user, profesor };
}
