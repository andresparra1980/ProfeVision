import { createClient } from "@supabase/supabase-js";
import { runPipelineWithHooks, PipelineInputSchema } from "@/lib/ai/similar-exam/chains/pipeline";
import { JobsSimilarExamKeys } from "@/lib/ai/similar-exam/utils/i18nKeys";
import { ExamSchema } from "@/lib/ai/similar-exam/schemas/exam";
import { ZodError } from "zod";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function mapContractTypeToDb(tipo: string): string {
  switch (tipo) {
    case "multiple_choice":
      return "opcion_multiple";
    case "true_false":
      return "verdadero_falso";
    case "short_answer":
      return "respuesta_corta";
    case "essay":
      return "ensayo";
    default:
      return "respuesta_corta";
  }
}

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const supabase = supabaseAdmin();
  await supabase.from("procesos_examen_similar").update(patch).eq("id", jobId);
}

async function appendLog(jobId: string, entry: Record<string, unknown>) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("procesos_examen_similar")
    .select("logs")
    .eq("id", jobId)
    .maybeSingle();
  const prev = (data?.logs as any[]) || [];
  const next = [...prev, entry];
  await supabase.from("procesos_examen_similar").update({ logs: next }).eq("id", jobId);
}

async function emitStep(jobId: string, stepKey: string, status: "started" | "succeeded" | "failed") {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();
  // Update timings
  const { data } = await supabase
    .from("procesos_examen_similar")
    .select("timings")
    .eq("id", jobId)
    .maybeSingle();
  const timings: any[] = Array.isArray(data?.timings) ? [...(data!.timings as any[])] : [];
  const idx = timings.findIndex((t) => t.step === stepKey);
  if (status === "started") {
    if (idx === -1) timings.push({ step: stepKey, startedAt: now });
    else timings[idx] = { ...timings[idx], startedAt: timings[idx].startedAt ?? now };
  } else if (status === "succeeded") {
    if (idx === -1) timings.push({ step: stepKey, endedAt: now });
    else timings[idx] = { ...timings[idx], endedAt: now };
  }
  await supabase
    .from("procesos_examen_similar")
    .update({ status: status === "succeeded" ? "running" : status, step: stepKey, timings })
    .eq("id", jobId);
  await appendLog(jobId, { at: now, level: status === "failed" ? "error" : "debug", msg: `step ${status}`, step: stepKey });
}

function mapTipoPreguntaToContract(tipoId: string): "multiple_choice" | "true_false" | "short_answer" | "essay" {
  switch (tipoId) {
    case "multiple_choice":
    case "opcion_multiple":
      return "multiple_choice";
    case "true_false":
    case "verdadero_falso":
      return "true_false";
    case "short_answer":
    case "respuesta_corta":
      return "short_answer";
    case "essay":
    case "ensayo":
      return "essay";
    default:
      return "multiple_choice";
  }
}

async function loadSourceExam(examId: string) {
  const supabase = supabaseAdmin();
  // exam and subject
  const { data: examRow, error: examErr } = await supabase
    .from("examenes")
    .select("id, titulo, descripcion, instrucciones, materia_id, profesor_id, estado, duracion_minutos, puntaje_total, materias:materia_id(nombre)")
    .eq("id", examId)
    .single();
  if (examErr || !examRow) throw new Error("source exam not found");

  // questions
  const { data: preguntas, error: pregErr } = await supabase
    .from("preguntas")
    .select("id, texto, tipo_id, puntaje, dificultad, retroalimentacion, orden, habilitada")
    .eq("examen_id", examId)
    .order("orden", { ascending: true });
  if (pregErr) throw new Error("failed to load preguntas");

  // options for all questions
  const preguntaIds = (preguntas || []).map((p: any) => p.id);
  let opciones: any[] = [];
  if (preguntaIds.length) {
    const { data: opts, error: optErr } = await supabase
      .from("opciones_respuesta")
      .select("id, pregunta_id, texto, es_correcta, orden")
      .in("pregunta_id", preguntaIds)
      .order("orden", { ascending: true });
    if (optErr) throw new Error("failed to load opciones");
    opciones = opts || [];
  }

  const questions = (preguntas || []).map((p: any, idx: number) => {
    const qOpts = opciones.filter((o) => o.pregunta_id === p.id);
    const type = mapTipoPreguntaToContract(p.tipo_id);
    const options = type === "multiple_choice" ? qOpts.map((o) => o.texto as string) : [];
    let answer: any = null;
    if (type === "multiple_choice") {
      const correctIndex = qOpts.findIndex((o) => o.es_correcta);
      answer = correctIndex >= 0 ? correctIndex : 0;
    } else if (type === "true_false") {
      // Try to parse from retroalimentacion or dificultad if encoded; default false
      answer = false;
    } else {
      answer = null;
    }
    return {
      id: `q${idx + 1}`,
      type,
      prompt: p.texto as string,
      options,
      answer,
      rationale: p.retroalimentacion ?? "",
      difficulty: ["easy", "medium", "hard"].includes(p.dificultad) ? p.dificultad : "medium",
      taxonomy: "understand",
      tags: [],
      source: { documentId: null, spans: [] },
    };
  });

  const subjectName = Array.isArray((examRow as any).materias)
    ? (examRow as any).materias[0]?.nombre
    : (examRow as any).materias?.nombre;
  const sourceExam = {
    exam: {
      title: examRow.titulo as string,
      subject: subjectName ?? "General",
      level: "N/A",
      language: "es",
      questions,
    },
  };

  return ExamSchema.parse(sourceExam);
}

async function resolveMateriaIdForProfessor(subjectName: string, profesorId: string): Promise<string> {
  const supabase = supabaseAdmin();
  // Try exact/ilike match for this professor
  const { data: m1 } = await supabase
    .from("materias")
    .select("id")
    .eq("profesor_id", profesorId)
    .ilike("nombre", subjectName)
    .maybeSingle();
  if (m1?.id) return m1.id as string;
  // Fallback: first materia for professor
  const { data: m2 } = await supabase
    .from("materias")
    .select("id")
    .eq("profesor_id", profesorId)
    .limit(1)
    .maybeSingle();
  if (m2?.id) return m2.id as string;
  throw new Error("No materia for professor");
}

type StartMeta = {
  title: string;
  materiaId: string;
  durationMinutes?: number;
  totalScore?: number;
};

async function insertDraftExam(userId: string, draft: any, meta?: StartMeta): Promise<string> {
  const supabase = supabaseAdmin();
  const materiaId = meta?.materiaId ?? (await resolveMateriaIdForProfessor(draft.exam.subject, userId));

  // Insert examenes
  const { data: examInsert, error: examInsErr } = await supabase
    .from("examenes")
    .insert([
      {
        titulo: meta?.title ?? draft.exam.title,
        descripcion: null,
        instrucciones: null,
        materia_id: materiaId,
        profesor_id: userId,
        estado: "borrador",
        duracion_minutos: meta?.durationMinutes ?? null,
        puntaje_total: meta?.totalScore ?? 100,
      },
    ])
    .select("id")
    .single();
  if (examInsErr || !examInsert) throw new Error("failed to insert examenes");
  const newExamId = examInsert.id as string;

  // Insert preguntas and opciones with manual rollback on failure
  const insertedPreguntaIds: string[] = [];
  try {
    // Insert preguntas
    const preguntasRows = (draft.exam.questions as any[]).map((q, idx) => ({
      examen_id: newExamId,
      texto: String(q.prompt ?? "").slice(0, 8000),
      tipo_id: mapContractTypeToDb(q.type),
      puntaje: 1.0,
      dificultad: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
      retroalimentacion: q.rationale ?? null,
      orden: idx + 1,
      habilitada: true,
    }));
    const { data: pregInserts, error: pregErr } = await supabase
      .from("preguntas")
      .insert(preguntasRows)
      .select("id, orden");
    if (pregErr) throw new Error("failed to insert preguntas");

    const idByOrden = new Map<number, string>();
    for (const r of pregInserts || []) {
      idByOrden.set(r.orden as number, r.id as string);
      insertedPreguntaIds.push(r.id as string);
    }

    // Insert opciones_respuesta for MCQ
    const opcionesRows: any[] = [];
    (draft.exam.questions as any[]).forEach((q, idx) => {
      if (q.type !== "multiple_choice" || !Array.isArray(q.options)) return;
      const preguntaId = idByOrden.get(idx + 1);
      if (!preguntaId) return;
      const correctIndex = typeof q.answer === "number" ? q.answer : q.options.findIndex((o: string) => o === q.answer);
      q.options.forEach((opt: string, i: number) => {
        opcionesRows.push({
          pregunta_id: preguntaId,
          texto: opt,
          es_correcta: i === (correctIndex >= 0 ? correctIndex : 0),
          orden: i + 1,
        });
      });
    });
    if (opcionesRows.length) {
      const { error: optErr } = await supabase.from("opciones_respuesta").insert(opcionesRows);
      if (optErr) throw new Error("failed to insert opciones_respuesta");
    }
  } catch (inner) {
    // Rollback preguntas and exam to avoid orphan data
    try {
      if (insertedPreguntaIds.length) {
        await supabase.from("opciones_respuesta").delete().in("pregunta_id", insertedPreguntaIds);
        await supabase.from("preguntas").delete().in("id", insertedPreguntaIds);
      }
      await supabase.from("examenes").delete().eq("id", newExamId);
    } catch {
      // best-effort cleanup
    }
    throw inner;
  }

  return newExamId;
}

export async function runJob(jobId: string, payload: unknown) {
  let draftIdOuter: string | null = null;
  try {
    const supabase = supabaseAdmin();
    // Load job to get user and source
    const { data: jobRow, error: jobErr } = await supabase
      .from("procesos_examen_similar")
      .select("id, user_id, source_exam_id, seed, error_meta, status, draft_exam_id")
      .eq("id", jobId)
      .single();
    if (jobErr || !jobRow) throw new Error("job not found");
    // Idempotency: if already completed with a draft, exit silently
    if (jobRow.status === "completed" && jobRow.draft_exam_id) {
      return;
    }
    // Transition to running only if not completed
    if (jobRow.status !== "running") {
      await updateJob(jobId, { status: "running", step: "loadBlueprint" });
      await appendLog(jobId, { at: new Date().toISOString(), level: "info", msg: "job started" });
    }
    const sourceExam = await loadSourceExam(jobRow.source_exam_id);
    const parsed = PipelineInputSchema.parse({ sourceExam, language: sourceExam.exam.language, seed: jobRow.seed ?? 42 });

    // Drive step transitions via pipeline hooks
    const { draftExam } = await runPipelineWithHooks(
      {
        sourceExam: parsed.sourceExam,
        language: parsed.language,
        seed: parsed.seed,
      },
      async (step, status) => {
        await emitStep(jobId, step, status);
      },
    );

    const meta: StartMeta | undefined = (jobRow as any)?.error_meta?.input ?? undefined;
    // Double-check before inserting in case of race
    {
      const { data: latest } = await supabase
        .from("procesos_examen_similar")
        .select("status, draft_exam_id")
        .eq("id", jobId)
        .maybeSingle();
      if (latest?.status === "completed" && latest?.draft_exam_id) {
        return;
      }
    }
    draftIdOuter = await insertDraftExam(jobRow.user_id as string, draftExam, meta);

    await updateJob(jobId, { status: "completed", step: "finalize", draft_exam_id: draftIdOuter });
    await appendLog(jobId, { at: new Date().toISOString(), level: "info", msg: "job completed", draftId: draftIdOuter });
    await emitStep(jobId, "finalize", "succeeded");
  } catch (e) {
    const supabase = supabaseAdmin();
    // If we already created a draft, ensure the job is marked completed with that ID
    if (draftIdOuter) {
      await updateJob(jobId, { status: "completed", step: "finalize", draft_exam_id: draftIdOuter });
      await appendLog(jobId, { at: new Date().toISOString(), level: "warn", msg: "job completed after error (draft already created)", draftId: draftIdOuter });
      return;
    }
    // Don't flip a completed job to failed if some late error occurs
    const { data: latest } = await supabase
      .from("procesos_examen_similar")
      .select("status, draft_exam_id")
      .eq("id", jobId)
      .maybeSingle();
    if (latest?.status !== "completed") {
      // If we already inserted draft (race case), mark completed; else mark failed with step-specific key
      if (latest?.draft_exam_id) {
        await updateJob(jobId, { status: "completed", step: "finalize" });
      } else {
        // Choose a specific error key based on the error type/message
        let errKey: string = JobsSimilarExamKeys.errors.unknown as string;
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        if (e instanceof ZodError) {
          errKey = JobsSimilarExamKeys.errors.schemaInvalid as string;
        } else if (msg.includes("not found") || msg.includes("no exam") || msg.includes("job not found")) {
          errKey = JobsSimilarExamKeys.errors.sourceNotFound as string;
        } else if (msg.includes("timeout") || msg.includes("timed out")) {
          errKey = JobsSimilarExamKeys.errors.timeout as string;
        } else if (msg.includes("parse") && msg.includes("json")) {
          errKey = JobsSimilarExamKeys.errors.parseFailed as string;
        } else {
          // Fall back to step-based error if we have a current step
          const { data: jr } = await supabase
            .from("procesos_examen_similar")
            .select("step")
            .eq("id", jobId)
            .maybeSingle();
          const step = (jr?.step as string | undefined) || undefined;
          if (step) errKey = `jobs.similarExam.errors.${step}`;
        }
        await updateJob(jobId, { status: "failed", error_key: errKey });
        await appendLog(jobId, { at: new Date().toISOString(), level: "error", msg: "job failed", error: (e instanceof Error ? e.message : String(e)), error_key: errKey });
      }
    }
  }
}
