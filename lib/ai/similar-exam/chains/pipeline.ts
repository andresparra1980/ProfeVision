import { z } from "zod";
import { ExamSchema, sanitizeAIExamPayload } from "../schemas/exam";
import { deriveBlueprint } from "../utils/blueprint";
import { randomizeExamOrder, type ExamLike } from "../utils/randomizeExam";
import { readFile } from "fs/promises";
import path from "path";
import { buildChatModel, getFallbackProvider, getPrimaryProvider, withFallback } from "../llm/client";
// zod-to-json-schema can be used for advanced JSON schema guidance if needed

export const PipelineInputSchema = z.object({
  sourceExam: ExamSchema,
  language: z.string().min(2).default("es"),
  seed: z.number().int().default(42)
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

export interface PipelineOutput {
  draftExam: z.infer<typeof ExamSchema>;
  blueprint: ReturnType<typeof deriveBlueprint>;
}

async function loadPrompt(rel: string): Promise<string> {
  const filePath = path.join(process.cwd(), "lib", "ai", "similar-exam", "prompts", rel);
  const buf = await readFile(filePath);
  return buf.toString("utf-8");
}

type ChatMessage = { role: "system" | "user"; content: string };

async function generateSimilarExam(input: PipelineInput): Promise<z.infer<typeof ExamSchema>> {
  const sanitized = sanitizeAIExamPayload(input.sourceExam);
  const sanitizedExam = ExamSchema.parse(sanitized);
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();
  if (!primary) {
    // Fallback to pass-through if no keys/models
    return ExamSchema.parse(sanitized);
  }
  const genPrompt = await loadPrompt("generate.txt");
  const call = async () => {
    const model = buildChatModel(primary, 0);
    // Treat output as unknown and validate with Zod
    const structured = model.withStructuredOutput(ExamSchema) as unknown as { invoke: (_msgs: ChatMessage[]) => Promise<unknown> };
    const referenceQuestions = sanitizedExam.exam.questions.map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      answer: q.answer,
    }));
    const messages: ChatMessage[] = [
      { role: "system", content: genPrompt },
      {
        role: "user",
        content: JSON.stringify({ language: input.language, blueprint: deriveBlueprint(sanitizedExam), reference_questions: referenceQuestions }),
      },
    ];
    const result = await structured.invoke(messages);
    return ExamSchema.parse(result as unknown);
  };
  const callFallback = fallback
    ? async () => {
        const model = buildChatModel(fallback, 0);
        const structured = model.withStructuredOutput(ExamSchema) as unknown as { invoke: (_msgs: ChatMessage[]) => Promise<unknown> };
        const referenceQuestions = sanitizedExam.exam.questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options || [],
          answer: q.answer,
        }));
        const messages: ChatMessage[] = [
          { role: "system", content: genPrompt },
          {
            role: "user",
            content: JSON.stringify({ language: input.language, blueprint: deriveBlueprint(sanitizedExam), reference_questions: referenceQuestions }),
          },
        ];
        const result = await structured.invoke(messages);
        return ExamSchema.parse(result as unknown);
      }
    : null;
  return withFallback(call, callFallback);
}

async function validateAndRecommend(exam: z.infer<typeof ExamSchema>, language: string): Promise<z.infer<typeof ExamSchema>> {
  // First validate strictly with Zod
  const parsed = ExamSchema.parse(exam);
  // Then ask LLM for recommendations (non-blocking)
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();
  if (!primary) return parsed;
  const valPrompt = await loadPrompt("validate.txt");
  const recommendationsSchema = z.object({ blockers: z.array(z.string()).default([]), warnings: z.array(z.string()).default([]), suggestions: z.array(z.string()).default([]) });
  const call = async () => {
    const model = buildChatModel(primary, 0);
    const structured = model.withStructuredOutput(recommendationsSchema) as unknown as { invoke: (_msgs: ChatMessage[]) => Promise<unknown> };
    const messages: ChatMessage[] = [
      { role: "system", content: valPrompt },
      { role: "user", content: JSON.stringify({ exam: parsed, language }) },
    ];
    const recUnknown = await structured.invoke(messages);
    const rec = recommendationsSchema.parse(recUnknown);
    if (rec.blockers && rec.blockers.length > 0) {
      // Surface as an error so worker maps to validate or schemaInvalid
      throw new Error("validation blockers: " + rec.blockers.join("; "));
    }
    return parsed;
  };
  const callFallback = fallback
    ? async () => {
        const model = buildChatModel(fallback, 0);
        const structured = model.withStructuredOutput(recommendationsSchema) as unknown as { invoke: (_msgs: ChatMessage[]) => Promise<unknown> };
        const messages: ChatMessage[] = [
          { role: "system", content: valPrompt },
          { role: "user", content: JSON.stringify({ exam: parsed, language }) },
        ];
        const recUnknown = await structured.invoke(messages);
        const rec = recommendationsSchema.parse(recUnknown);
        if (rec.blockers && rec.blockers.length > 0) {
          throw new Error("validation blockers: " + rec.blockers.join("; "));
        }
        return parsed;
      }
    : null;
  return withFallback(call, callFallback);
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const parsed = PipelineInputSchema.parse(input);

  return runPipelineWithHooks(parsed, () => {});
}

export type StepKey = "loadBlueprint" | "generate" | "validate" | "apply" | "randomize" | "finalize";
export type StepStatus = "started" | "succeeded" | "failed";
export type OnStep = (_step: StepKey, _status: StepStatus) => void | Promise<void>;

export async function runPipelineWithHooks(input: PipelineInput, onStep: OnStep): Promise<PipelineOutput> {
  const parsed = PipelineInputSchema.parse(input);
  const minMs = Number(process.env.SIMILAR_EXAM_MIN_STEP_MS ?? 400);
  const minQuickMs = Math.min(150, Math.floor(minMs / 2));
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const ensureMin = async (t0: number, targetMs: number) => {
    const dt = Date.now() - t0;
    if (dt < targetMs) await sleep(targetMs - dt);
  };
  // Step A: Build blueprint from source
  await onStep("loadBlueprint", "started");
  const t0A = Date.now();
  const blueprint = deriveBlueprint(parsed.sourceExam);
  await ensureMin(t0A, minQuickMs);
  await onStep("loadBlueprint", "succeeded");

  // Step B: Generate similar exam via LLM (with fallback)
  await onStep("generate", "started");
  const t0B = Date.now();
  const generated = await generateSimilarExam(parsed);
  await ensureMin(t0B, minMs);
  await onStep("generate", "succeeded");

  // Step C: Validate
  await onStep("validate", "started");
  const t0C = Date.now();
  const validated = await validateAndRecommend(generated, parsed.language);
  await ensureMin(t0C, minMs);
  await onStep("validate", "succeeded");

  // Step D: Apply recommendations (placeholder no-op)
  await onStep("apply", "started");
  const t0D = Date.now();
  const applied = validated; // no-op for now
  await ensureMin(t0D, minQuickMs);
  await onStep("apply", "succeeded");

  // Step E: Randomize deterministically
  await onStep("randomize", "started");
  const t0E = Date.now();
  const randomized = randomizeExamOrder(applied as unknown as ExamLike, parsed.seed) as z.infer<typeof ExamSchema>;
  await ensureMin(t0E, minQuickMs);
  await onStep("randomize", "succeeded");

  // Step F: Final validation
  await onStep("finalize", "started");
  const t0F = Date.now();
  const finalExam = ExamSchema.parse(randomized);
  await ensureMin(t0F, minQuickMs);
  await onStep("finalize", "succeeded");

  return { draftExam: finalExam, blueprint };
}
