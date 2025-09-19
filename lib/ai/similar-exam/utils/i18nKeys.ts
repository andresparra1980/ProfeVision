export const JobsSimilarExamKeys = {
  title: "jobs.similarExam.title",
  steps: {
    loadBlueprint: "jobs.similarExam.steps.loadBlueprint",
    generate: "jobs.similarExam.steps.generate",
    validate: "jobs.similarExam.steps.validate",
    apply: "jobs.similarExam.steps.apply",
    randomize: "jobs.similarExam.steps.randomize",
    finalize: "jobs.similarExam.steps.finalize",
  },
  status: {
    started: "jobs.similarExam.status.started",
    succeeded: "jobs.similarExam.status.succeeded",
    failed: "jobs.similarExam.status.failed",
  },
  errors: {
    schemaInvalid: "jobs.similarExam.errors.schemaInvalid",
    parseFailed: "jobs.similarExam.errors.parseFailed",
    timeout: "jobs.similarExam.errors.timeout",
    sourceNotFound: "jobs.similarExam.errors.sourceNotFound",
    tooLarge: "jobs.similarExam.errors.tooLarge",
    unknown: "jobs.similarExam.errors.unknown",
  },
} as const;

export type JobsSimilarExamKeysType = typeof JobsSimilarExamKeys;
