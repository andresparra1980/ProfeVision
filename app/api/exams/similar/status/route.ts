import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/utils/logger";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "Falta jobId" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Supabase config missing");
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 },
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("procesos_examen_similar")
      .select("id, user_id, status, step, timings, logs, error_key, error_meta, draft_exam_id, created_at, updated_at")
      .eq("id", jobId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });
    }
    if (data.user_id !== user.id) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    return NextResponse.json({
      job: {
        id: data.id,
        status: data.status,
        step: data.step,
        timings: data.timings,
        logs: data.logs,
        error_key: data.error_key,
        error_meta: data.error_meta,
        draft_exam_id: data.draft_exam_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (e) {
    logger.error("/api/exams/similar/status:ERROR", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
