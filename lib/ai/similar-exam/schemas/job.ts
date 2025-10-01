import { z } from "zod";

export const JobStatusEnum = z.enum(["queued", "running", "failed", "completed"]);
export const JobStepEnum = z.enum([
  "loadBlueprint",
  "generate",
  "validate",
  "apply",
  "randomize",
  "finalize",
]);

export const JobSchema = z.object({
  id: z.string(),
  sourceExamId: z.string(),
  status: JobStatusEnum,
  step: JobStepEnum.optional(),
  logs: z.array(z.string()).optional().default([]),
  error: z
    .object({
      key: z.string().optional(),
      message: z.string().optional(),
      meta: z.record(z.any()).optional(),
    })
    .optional(),
  timings: z
    .array(
      z.object({
        step: JobStepEnum,
        ms: z.number(),
      }),
    )
    .optional()
    .default([]),
  seed: z.number().optional(),
  langchainRunId: z.string().optional(),
});

export type Job = z.infer<typeof JobSchema>;
export type JobStatus = z.infer<typeof JobStatusEnum>;
export type JobStep = z.infer<typeof JobStepEnum>;
