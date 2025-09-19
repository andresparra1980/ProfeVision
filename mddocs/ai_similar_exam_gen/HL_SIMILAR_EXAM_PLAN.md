Goal
Add a one-click “Create similar exam” feature that runs an unattended pipeline and, upon success, saves the resulting exam as a Draft. During processing, a modal dialog displays progress with i18n-driven messages.

Core Requirements
- Must use LangChain JS (LCEL) for orchestration:
  - RunnableSequence/Map for step composition
  - Zod-based structured output parsing
  - Per-step retries/timeouts/fallbacks
  - LangSmith tracing enabled
- UX:
  - Clicking “Create similar exam” opens a modal that shows pipeline progress.
  - Modal uses deterministic i18n message keys for all user-visible text.
  - No exam row is created during processing; only upon successful completion is a Draft inserted.
  - On failure, no exam is created; modal shows an i18n error message and diagnostics.
- Data integrity:
  - Only create the Draft exam in DB after the pipeline completes and passes final validation.
- Deterministic finalization:
  - Seeded randomization for question and option order (pure code).
- Compliance:
  - Maintain ExamSchema contract and platform policies (auth, role, language).
- Observability:
  - Step-level logging, metrics, and traces.

Data Contracts
- ExamSchema: Shared Zod schema (generation, validation).
- RecommendationsSchema: Structured issues with severity/targets.
- Job schema:
  - A transient job record can be created to track progress and enable SSE; it must not imply the exam exists.
  - Fields: id, sourceExamId, status: queued|running|failed|completed, step, logs, error, timings, seed, langchainRunId.
- Progress event schema (for modal/SSE):
  - { jobId, stepKey, status: started|succeeded|failed, messageKey, meta? }
  - messageKey must map to i18n keys (e.g., jobs.similarExam.steps.generate, jobs.similarExam.status.succeeded).

System Design
- Frontend
  - Add button “Create similar exam” on exam row.
  - On click:
    - POST /api/exams/similar/start with { sourceExamId, language?, seed? }.
    - Open a modal immediately that subscribes to SSE on /api/exams/similar/stream?jobId=...
    - The modal renders progress using i18n message keys from events.
    - On “completed” event with draftExamId, close modal (or show success CTA) and refresh list.
    - On “failed” event, show retry button and diagnostics (mapped to i18n keys).
  - All modal strings must be driven by i18n:
    - Title key: jobs.similarExam.title
    - Step keys: jobs.similarExam.steps.generate, validate, apply, randomize, finalize
    - Status keys: jobs.similarExam.status.started, succeeded, failed
    - Error keys: jobs.similarExam.errors.parseFailed, schemaInvalid, timeout, unknown

- Backend API
  - POST /api/exams/similar/start
    - AuthN/AuthZ via Supabase + profesores role.
    - Input: { sourceExamId: string, language?: string, seed?: number }
    - Behavior:
      - Create a Job row (status: queued). Do NOT create an exam record here.
      - Enqueue or trigger worker execution (depending on infra).
      - Return { jobId }.
  - GET /api/exams/similar/stream?jobId=...
    - Server-Sent Events endpoint that streams progress events with i18n message keys.
  - Optional: GET /api/exams/similar/status?jobId=... for polling fallback.

- Worker (uses LangChain JS)
  - Execute pipeline with LCEL; per-step retries/timeouts.
  - Emit progress events with i18n message keys at step start/success/failure.
  - Only after all steps succeed:
    - Insert the exam as Draft into DB.
    - Emit final “completed” event with draftExamId.
  - On failure:
    - Emit “failed” with error category key and minimal diagnostics (no PII).
    - Do not create any exam.

Pipeline Steps (LangChain JS)
- Step A: Load + Blueprint
  - i18n progress: jobs.similarExam.steps.loadBlueprint
  - Fetch source exam, derive blueprint (types, difficulty, taxonomy distributions; tags; subject/level/language; average lengths).
  - Enforce “no verbatim reuse” constraint.
- Step B: GenerateSimilarExam (LLM)
  - i18n progress: jobs.similarExam.steps.generate
  - Prompt with blueprint; parser StructuredOutputParser.fromZodSchema(ExamSchema).
  - Retry/repair up to N attempts.
- Step C: ValidateAndRecommend (LLM)
  - i18n progress: jobs.similarExam.steps.validate
  - Output RecommendationsSchema; retry/repair if parsing fails.
- Step D: ApplyRecommendations (LLM)
  - i18n progress: jobs.similarExam.steps.apply
  - Minimal edits; preserve distributions; parse to ExamSchema; retries.
- Step E: Randomize (code)
  - i18n progress: jobs.similarExam.steps.randomize
  - Seeded Fisher–Yates for questions and MCQ options; recompute answer mapping; reindex q1..qN.
- Step F: Final Validation (code)
  - i18n progress: jobs.similarExam.steps.finalize
  - Zod validate; sanitize difficulty; enforce MCQ constraints.
  - If fails and fixable: single “repair-to-schema” pass; else fail job.
- Persist (only on success)
  - Insert exam as Draft with full JSON.
  - Emit completed event: include draftExamId.

Observability & Ops
- LangSmith tracing enabled; store runId on Job.
- Log model, latency, token usage, retries per step.
- Map errors to i18n error keys:
  - jobs.similarExam.errors.schemaInvalid
  - jobs.similarExam.errors.parseFailed
  - jobs.similarExam.errors.timeout
  - jobs.similarExam.errors.sourceNotFound
  - jobs.similarExam.errors.unknown
- Idempotency: If a job restarts, ensure no duplicate exam is created:
  - Before insert, check Job status and whether an examId already exists.

Tech Choices
- Orchestration: LangChain JS (LCEL) required.
- Models via OpenRouter:
  - Generation: creative-mid (e.g., gemini-2.5-flash-lite)
  - Validation/fix: smaller, more deterministic model
- Parsers: StructuredOutputParser.fromZodSchema for ExamSchema and RecommendationsSchema.
- Transport: SSE for modal progress; fall back to polling if needed.

Frontend Modal Implementation Notes
- Modal opens immediately on start; subscribes to SSE.
- Render a vertical stepper:
  - Each step row uses titleKey + statusKey combinations for text.
  - Example event payload:
    - { jobId, stepKey: "generate", status: "started", messageKey: "jobs.similarExam.steps.generate" }
- Deterministic translations:
  - The backend only emits keys; the frontend maps keys via i18n JSON.
  - Avoid embedding dynamic human text from the backend; put dynamic data in meta fields and let the frontend interpolate using i18n (e.g., token counts).
- Provide actions:
  - Close/Cancel button that only dismisses the modal (job continues).
  - Retry button appears only on failed status and reissues /start with same parameters if desired.

Edge Cases
- Source exam missing: fail early with jobs.similarExam.errors.sourceNotFound.
- Overly long exams: include policy to cap questions or chunk; expose message key jobs.similarExam.errors.tooLarge if applicable.
- Non-deterministic language: enforce language in prompts and verify in validation step.

Deliverables for IDE
- schemas/
  - exam.ts (Zod + sanitizer)
  - recommendations.ts (Zod)
  - job.ts (Zod for Job; enum step keys and statuses)
  - progress.ts (Zod for SSE events with stepKey/messageKey enums)
- prompts/
  - generateSimilarExam.ts (includes parser.getFormatInstructions())
  - validateExam.ts
  - applyRecommendations.ts
  - repairToSchema.ts
- chains/ (LangChain JS)
  - generateChain.ts (prompt -> model -> parser with retries)
  - validateChain.ts
  - applyChain.ts
  - pipeline.ts (composes and emits progress events)
- utils/
  - randomizeExam.ts (seeded shuffle + answer remap)
  - blueprint.ts (derive blueprint)
  - langsmith.ts (tracing)
  - i18nKeys.ts (export constant enums for step and error keys to keep FE/BE aligned)
- api/
  - POST /api/exams/similar/start (create Job only; return jobId)
  - GET /api/exams/similar/stream (SSE progress)
  - Optional: GET /api/exams/similar/status (polling)
- worker/
  - jobRunner.ts (executes pipeline, updates Job, emits SSE)
- frontend/
  - SimilarExamModal.tsx (subscribes to SSE, renders stepper using i18n keys)
  - Button to open modal and call /start
  - i18n message JSON entries for all keys

Milestones
- M1: API /start + Job model + SSE stream + modal skeleton with i18n keys.
- M2: LangChain setup (LCEL + parsers + tracing) and Generate step with retries.
- M3: Validate + Apply steps wired; i18n eventing verified.
- M4: Randomize + final validation; DB insert as Draft; completion event.
- M5: Robust error mapping to i18n keys; polish UX and observability.

Success Criteria
- Modal shows deterministic i18n-driven progress from start to finish.
- No exam is created until the job completes successfully; then a single Draft record is inserted.
- >95% unattended success with retries/repairs.
- Traces and logs allow quick diagnosis; frontend messages remain fully localizable.