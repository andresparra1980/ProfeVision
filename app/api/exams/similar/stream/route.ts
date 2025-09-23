import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/utils/logger";
import { runJob } from "@/worker/jobRunner";

export const dynamic = "force-dynamic";

function sseEvent(name: string, data: unknown) {
  return `event: ${name}\n` + `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const token = searchParams.get("token");
  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Supabase config missing", { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Validate user via token param (EventSource cannot send headers). Optional if you keep this internal.
  let userId: string | null = null;
  try {
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }
  } catch (_e) {
    // ignore, will continue without ownership check
  }

  // Fetch job and check ownership if token provided
  if (userId) {
    const { data: jobRow, error: jobErr } = await supabase
      .from("procesos_examen_similar")
      .select("id, user_id, status, step, source_exam_id, seed")
      .eq("id", jobId)
      .single();
    if (jobErr || !jobRow) {
      return new Response("Job not found", { status: 404 });
    }
    if (jobRow.user_id !== userId) {
      return new Response("Forbidden", { status: 403 });
    }
    // If queued, trigger worker in background
    if (jobRow.status === "queued") {
      // Fire and forget
      runJob(jobId, { sourceExamId: jobRow.source_exam_id, seed: jobRow.seed ?? 42 }).catch((e) => {
        logger?.error?.("runJob failed", e);
      });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseEvent("open", { jobId })));

      const steps = ["loadBlueprint", "generate", "validate", "apply", "randomize", "finalize"] as const;
      type Step = typeof steps[number];
      const seen: { started: Set<Step>; succeeded: Set<Step> } = {
        started: new Set(),
        succeeded: new Set(),
      };
      let lastStepIndex = -1;
      while (true) {
        try {
          const { data: row } = await supabase
            .from("procesos_examen_similar")
            .select("status, step, error_key, draft_exam_id")
            .eq("id", jobId)
            .maybeSingle();

          if (!row) {
            controller.enqueue(encoder.encode(sseEvent("error", { jobId, messageKey: "jobs.similarExam.errors.unknown" })));
            break;
          }

          type Row = { status: string; step: Step | null; error_key: string | null; draft_exam_id: string | null };
          const typed = row as Row;
          const status = typed.status;
          const step = typed.step;

          // Emit started for current step
          if (status === "running" && step) {
            const idx = steps.indexOf(step);
            if (idx >= 0 && !seen.started.has(step)) {
              controller.enqueue(
                encoder.encode(
                  sseEvent("progress", { jobId, stepKey: step, status: "started", messageKey: `jobs.similarExam.steps.${step}` }),
                ),
              );
              seen.started.add(step);
              // Mark previous step succeeded if we advanced
              if (lastStepIndex >= 0 && idx > lastStepIndex) {
                const prev = steps[lastStepIndex];
                if (prev && !seen.succeeded.has(prev)) {
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("progress", { jobId, stepKey: prev, status: "succeeded", messageKey: `jobs.similarExam.steps.${prev}` }),
                    ),
                  );
                  seen.succeeded.add(prev);
                }
              }
              lastStepIndex = Math.max(lastStepIndex, idx);
            }
          }

          if (status === "completed") {
            // Succeed current step if needed
            if (step && !seen.succeeded.has(step)) {
              controller.enqueue(
                encoder.encode(
                  sseEvent("progress", { jobId, stepKey: step, status: "succeeded", messageKey: `jobs.similarExam.steps.${step}` }),
                ),
              );
              seen.succeeded.add(step);
            }
            controller.enqueue(
              encoder.encode(
                sseEvent("completed", { jobId, draftExamId: typed.draft_exam_id, messageKey: "jobs.similarExam.status.succeeded" }),
              ),
            );
            break;
          }

          if (status === "failed") {
            const rawKey = typed.error_key;
            const msgKey = rawKey && rawKey.startsWith("jobs.")
              ? rawKey
              : `jobs.similarExam.errors.${rawKey ?? "unknown"}`;
            controller.enqueue(
              encoder.encode(
                sseEvent("progress", { jobId, stepKey: step ?? "loadBlueprint", status: "failed", messageKey: msgKey }),
              ),
            );
            controller.enqueue(
              encoder.encode(
                sseEvent("failed", { jobId, messageKey: msgKey }),
              ),
            );
            break;
          }

          // Small delay
          await new Promise((r) => setTimeout(r, 500));
        } catch (e) {
          logger?.error?.("SSE polling loop error", e);
          break;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
