import { z } from "zod";

export const StepKeyEnum = z.enum([
  "loadBlueprint",
  "generate",
  "validate",
  "apply",
  "randomize",
  "finalize",
]);

export const StepStatusEnum = z.enum(["started", "succeeded", "failed"]);

export const ProgressEventSchema = z.object({
  jobId: z.string(),
  stepKey: StepKeyEnum,
  status: StepStatusEnum,
  messageKey: z.string(),
  meta: z.record(z.any()).optional(),
});

export type StepKey = z.infer<typeof StepKeyEnum>;
export type StepStatus = z.infer<typeof StepStatusEnum>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
