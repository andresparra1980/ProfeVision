# Low-Level Implementation Plan: Create Similar Exam Feature

## Overview
This plan breaks down the high-level requirements into actionable, granular tasks for implementing the "Create Similar Exam" feature. The feature enables users to generate AI-powered similar exams from an existing source exam, with real-time progress tracking via a modal interface, using LangChain JS for orchestration and Zod for data validation.

## Core Components Breakdown

### 1. Schemas and Data Models
**Estimated Time: 1-2 days**

#### Zod Schemas
- [ ] Create `schemas/exam.ts`: Implement ExamSchema with Zod validation, sanitizers for difficulty, MCQ constraints, and i18n compliance
- [ ] Create `schemas/recommendations.ts`: Define RecommendationsSchema with severity levels and target fields
- [ ] Create `schemas/job.ts`: Define Job schema with status enum (queued/running/failed/completed), step tracking, logs, timings, and seed
- [ ] Create `schemas/progress.ts`: Define SSE event schema with stepKey, status, messageKey, and optional meta fields

#### Database Models
- [ ] Create Job table migration: Fields include id, sourceExamId, status, step, logs, error, timings, seed, langchainRunId
- [ ] Update Exam table: Ensure Draft status support and necessary fields for similar exam generation
- [ ] Add indexes for Job queries: On status, sourceExamId for performance

### 2. Utility Functions and Helpers
**Estimated Time: 1 day**

- [ ] Create `utils/blueprint.ts`: Implement blueprint derivation logic (types, difficulty, taxonomy distributions, tags, subject/level/language, average lengths)
- [ ] Create `utils/randomizeExam.ts`: Implement seeded Fisher-Yates shuffle for questions and MCQ options, answer remapping, and reindexing
- [ ] Create `utils/langsmith.ts`: Set up LangSmith tracing configuration and run ID management
- [ ] Create `utils/i18nKeys.ts`: Define constant enums for all step, status, and error message keys to maintain FE/BE alignment

### 3. LangChain Pipeline Components
**Estimated Time: 3-4 days**

#### Prompts
- [ ] Create `prompts/generateSimilarExam.ts`: Design prompt for LLM generation with blueprint input, include format instructions from parser
- [ ] Create `prompts/validateExam.ts`: Create validation prompt that outputs recommendations schema
- [ ] Create `prompts/applyRecommendations.ts`: Design prompt for applying recommendations with minimal edits
- [ ] Create `prompts/repairToSchema.ts`: Create repair prompt for final schema compliance fixes

#### Chains
- [ ] Create `chains/generateChain.ts`: Implement RunnableSequence with prompt → model → parser, add retry logic and error handling
- [ ] Create `chains/validateChain.ts`: Create validation chain with structured output parsing and retry/repair
- [ ] Create `chains/applyChain.ts`: Implement recommendation application chain with schema validation
- [ ] Create `chains/pipeline.ts`: Compose all chains into main pipeline with progress event emission and LCEL orchestration

### 4. Backend API Implementation
**Estimated Time: 2-3 days**

#### Core Endpoints
- [ ] Implement `POST /api/exams/similar/start`:
  - Add Supabase auth middleware with profesores role check
  - Validate input schema (sourceExamId, language?, seed?)
  - Create Job record (status: queued)
  - Trigger worker execution
  - Return jobId
- [ ] Implement `GET /api/exams/similar/stream`:
  - Set up Server-Sent Events endpoint
  - Stream progress events with i18n message keys
  - Handle job status queries and event emission
- [ ] Implement `GET /api/exams/similar/status` (optional polling fallback):
  - Return current job status and progress
  - Include last completed step and any error information

#### Worker Implementation
- [ ] Create `worker/jobRunner.ts`:
  - Execute LangChain pipeline with proper error handling
  - Update Job status and logs throughout execution
  - Emit SSE events at each step transition
  - Handle idempotency checks before exam creation
  - Insert exam as Draft only on successful completion

### 5. Frontend Implementation
**Estimated Time: 2-3 days**

#### UI Components
- [ ] Create `SimilarExamModal.tsx`:
  - Implement modal with vertical stepper layout
  - Set up SSE subscription and event handling
  - Render progress using i18n message keys
  - Add close/cancel and retry button functionality
- [ ] Add "Create Similar Exam" button to exam row component:
  - Handle click to call /start endpoint
  - Open modal immediately with SSE subscription
  - Refresh exam list on successful completion

#### i18n Integration
- [ ] Add i18n message entries:
  - Modal titles: `jobs.similarExam.title`
  - Step messages: `jobs.similarExam.steps.loadBlueprint`, `generate`, `validate`, `apply`, `randomize`, `finalize`
  - Status messages: `jobs.similarExam.status.started`, `succeeded`, `failed`
  - Error messages: `jobs.similarExam.errors.schemaInvalid`, `parseFailed`, `timeout`, `sourceNotFound`, `unknown`, `tooLarge`

### 6. Error Handling and Observability
**Estimated Time: 1-2 days**

#### Error Mapping
- [ ] Implement error categorization logic:
  - Map LangChain errors to i18n keys
  - Add diagnostic information without exposing PII
  - Handle timeouts and retry exhaustion
- [ ] Set up comprehensive logging:
  - Step-level logging with structured data
  - Token usage and latency metrics
  - LangSmith trace integration

#### Monitoring
- [ ] Add metrics collection:
  - Success rates per step
  - Average execution times
  - Error frequency by category
- [ ] Implement health checks for worker processes

## Implementation Milestones

### Milestone 1: Foundation Setup (Week 1)
- Complete all Zod schemas
- Set up database migrations for Job table
- Create utility functions (blueprint, randomize, i18n keys)
- Implement basic API endpoints with mock responses
- Set up modal skeleton with i18n keys

### Milestone 2: LangChain Integration (Week 2)
- Implement all prompts and chains
- Set up LangSmith tracing
- Create main pipeline composition
- Wire up basic worker execution
- Test end-to-end pipeline locally

### Milestone 3: Full Feature Integration (Week 3)
- Complete frontend modal with SSE
- Implement progress event emission
- Add retry and error handling
- Wire up database operations
- Add idempotency checks

### Milestone 4: Polish and Testing (Week 4)
- Comprehensive error mapping
- Performance optimization
- Load testing and edge case handling
- Documentation and code review
- Production readiness checks

## Dependencies and Prerequisites
- [ ] Supabase authentication setup
- [ ] OpenRouter API access and configuration
- [ ] LangSmith account and tracing setup
- [ ] Database schema updates for Job table
- [ ] i18n system with new message keys
- [ ] SSE/WebSocket infrastructure (if not already available)

## Risk Mitigation
- Implement comprehensive retry logic for LLM calls
- Add circuit breakers for external API failures
- Use seeded randomization for deterministic testing
- Implement proper cleanup for failed jobs
- Add rate limiting for exam generation requests

## Success Metrics
- Modal displays accurate, localized progress messages
- >95% success rate for exam generation with retries
- No duplicate exams created on job retries
- All user-facing text properly internationalized
- Complete LangSmith traces for debugging
- Sub-30 second average generation time
