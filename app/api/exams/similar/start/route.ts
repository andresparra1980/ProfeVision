import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import logger from "@/lib/utils/logger";
import { runJob } from "@/worker/jobRunner";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = "force-dynamic";

const StartRequestSchema = z.object({
  sourceExamId: z.string().min(1),
  language: z.string().min(2).optional(),
  seed: z.number().int().optional(),
  meta: z
    .object({
      title: z.string().min(1),
      materiaId: z.string().uuid(),
      durationMinutes: z.number().int().min(1).optional(),
      totalScore: z.number().min(1).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  logger.api("/api/exams/similar/start:START");
  try {
    // Auth like /api/chat
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
    const { data: profesor } = await supabase
      .from("profesores")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profesor) {
      return NextResponse.json(
        { error: "Solo los profesores pueden usar este endpoint" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = StartRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { sourceExamId, language, seed, meta } = parsed.data;

    // Insert Job row in Supabase
    const { data: inserted, error: insertError } = await supabase
      .from("procesos_examen_similar")
      .insert([
        {
          user_id: user.id,
          source_exam_id: sourceExamId,
          status: "queued",
          step: null,
          seed: seed ?? null,
          langchain_run_id: null,
          error_key: null,
          error_meta: meta ? { input: meta } : null,
          timings: [],
          logs: [{ at: new Date().toISOString(), msg: "start requested", language }],
          draft_exam_id: null,
        },
      ])
      .select("id")
      .single();

    if (insertError || !inserted) {
      logger.error("/api/exams/similar/start:INSERT_ERROR", insertError);
      return NextResponse.json(
        { error: "No se pudo crear el proceso" },
        { status: 500 },
      );
    }

    const jobId = inserted.id as string;
    logger.api("/api/exams/similar/start:OK", { jobId, sourceExamId, language, seed });
    // Fire-and-forget: kick off the worker now
    runJob(jobId, { sourceExamId, seed }).catch((e) => logger.error("runJob error", e));
    return NextResponse.json({ jobId });
  } catch (e) {
    logger.error("/api/exams/similar/start:ERROR", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
