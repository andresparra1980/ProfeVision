/**
 * Chat Mastra API Route
 *
 * Server-Sent Events (SSE) endpoint for AI-powered exam generation
 * using the Mastra framework.
 *
 * Features:
 * - Authentication and authorization
 * - Tier-based feature access control
 * - Real-time streaming progress via SSE
 * - i18n support with locale detection
 * - Error handling and recovery
 *
 * @see mddocs/ai_chat_mastra/PLAN_ALTO_NIVEL.md
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.12
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTeacherAuth } from "@/lib/auth/verify-teacher";
import { TierService } from "@/lib/services/tier-service";
import { ChatRequestSchema } from "@/lib/ai/chat/schemas";
import { mastra } from "@/lib/ai/mastra";
import { llmCallCapture } from "@/lib/ai/mastra/agents/chat-orchestrator";
import { detectLanguageFromMessage, detectMessageLanguage } from "@/lib/ai/utils/language-detection";
import { sanitizeDocumentContent } from "@/lib/utils/sanitize-prompt";
import logger from "@/lib/utils/logger";
import { z } from "zod";
import {
  initializeLangSmithClient,
  createMastraRootRun,
  trackAgentStep,
  trackLLMCall,
  trackToolExecution,
  trackAutoProcessing,
  trackRecovery,
  finalizeMastraRun,
} from "@/lib/ai/mastra/langsmith";

// SSE requires Node.js runtime (not Edge)
export const runtime = "nodejs";

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mastra agent types - minimal interface for what we use
interface MastraStepEvent {
  text?: string;
  toolCalls?: Array<{
    type?: string;
    payload?: {
      toolName?: string;
      args?: unknown;
    };
  }>;
}

/**
 * POST /api/chat-mastra
 *
 * Handles streaming chat requests for AI exam generation.
 *
 * Request body:
 * - messages: Array of chat messages
 * - context: Chat context (language, difficulty, topics, etc.)
 *
 * Response:
 * - Server-Sent Events stream with progress updates
 */
export async function POST(req: NextRequest) {
  try {
    // ========================================================================
    // 1. FEATURE FLAG CHECK
    // ========================================================================
    if (process.env.AI_CHAT_MASTRA !== "true") {
      logger.warn("Mastra chat feature is disabled");
      return Response.json(
        { error: "Feature not enabled", code: "FEATURE_DISABLED" },
        { status: 503 }
      );
    }

    // ========================================================================
    // 2. AUTHENTICATION
    // ========================================================================
    let userId: string;
    try {
      const authResult = await verifyTeacherAuth(req);
      userId = authResult.user.id;
      logger.api("Chat-mastra request authenticated", { userId });
    } catch (error) {
      const errorCode =
        error instanceof Error ? error.message : "AUTHENTICATION_FAILED";
      logger.auth("Authentication failed", { errorCode });

      return Response.json(
        { error: "Unauthorized", code: errorCode },
        { status: 401 }
      );
    }

    // ========================================================================
    // 3. SUPABASE CLIENT
    // ========================================================================
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Supabase configuration missing");
      return Response.json(
        { error: "Server configuration error", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================================================
    // 4. TIER LIMITS CHECK
    // ========================================================================
    try {
      const featureCheck = await TierService.checkFeatureAccess(
        supabase,
        userId,
        "ai_generation"
      );

      if (!featureCheck.allowed) {
        logger.warn("AI generation limit reached", {
          userId,
          tier: featureCheck.tier,
          used: featureCheck.used,
          limit: featureCheck.limit,
        });

        return Response.json(
          {
            error: "Feature limit reached",
            code: "LIMIT_REACHED",
            data: {
              tier: featureCheck.tier,
              limit: featureCheck.limit,
              used: featureCheck.used,
              remaining: featureCheck.remaining,
              cycleEnd: featureCheck.cycle_end,
            },
          },
          { status: 403 }
        );
      }

      logger.api("Tier check passed", {
        userId,
        tier: featureCheck.tier,
        remaining: featureCheck.remaining,
      });
    } catch (error) {
      logger.error("Tier check failed", { error, userId });
      return Response.json(
        { error: "Failed to verify tier limits", code: "TIER_CHECK_FAILED" },
        { status: 500 }
      );
    }

    // ========================================================================
    // 5. REQUEST VALIDATION
    // ========================================================================
    type ChatRequest = z.infer<typeof ChatRequestSchema>;
    let messages: ChatRequest["messages"];
    let context: ChatRequest["context"];

    try {
      const body = await req.json();
      const validated = ChatRequestSchema.parse(body);
      messages = validated.messages;
      context = validated.context;

      logger.api("Request validated", {
        userId,
        messageCount: messages.length,
        language: context.language,
        languageOverride: context.languageOverride,
        numQuestions: context.numQuestions,
        documentSummariesCount: context.topicSummaries?.length || 0,
        hasExistingExam: !!context.existingExam,
      });
    } catch (error) {
      logger.error("Request validation failed", { error, userId });
      return Response.json(
        {
          error: "Invalid request format",
          code: "VALIDATION_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 6. LOCALE DETECTION (UI vs Generation)
    // ========================================================================
    // Two distinct language concerns:
    // - uiLocale: Language for agent conversational responses (from next-intl)
    // - generationLocale: Language for exam content (from priority detection)

    // UI Locale: Always from frontend context (next-intl locale)
    const uiLocale = context.language || 'es';

    // Generation Locale: Priority order (Issue #40 Phase 3)
    // 0. User explicit override (languageOverride !== 'auto') - HIGHEST
    // 1. Existing exam language (if modifying existing exam)
    // 2. Exam type hints (TOEFL → en, Selectividad → es)
    // 3. Message text analysis (accents, word frequency)
    // 4. UI locale fallback (frontend context.language)
    // 5. Headers (x-locale, accept-language)
    // 6. Default: "es"
    const generationLocale = (() => {
      // Debug log for languageOverride
      logger.api("Checking languageOverride for generation", {
        userId,
        languageOverride: context.languageOverride,
        type: typeof context.languageOverride,
        isNotAuto: context.languageOverride !== 'auto',
        condition: context.languageOverride && context.languageOverride !== 'auto'
      });

      // Priority 0: User explicit override (highest priority)
      if (context.languageOverride && context.languageOverride !== 'auto') {
        logger.api("Generation locale from user override", {
          userId,
          generationLocale: context.languageOverride,
          source: "user_override"
        });
        return context.languageOverride;
      }

      // Priority 1: Existing exam language (strongest signal for modifications)
      if (context.existingExam?.exam?.language) {
        logger.api("Generation locale from existing exam", {
          userId,
          generationLocale: context.existingExam.exam.language,
          source: "existing_exam"
        });
        return context.existingExam.exam.language;
      }

      // Get last user message for analysis
      const lastUserMessage = messages[messages.length - 1]?.content || "";

      // Priority 2: Exam type hints (TOEFL, IELTS, Selectividad, etc.)
      const examHintLang = detectLanguageFromMessage(lastUserMessage);
      if (examHintLang) {
        logger.api("Generation locale from exam type hint", {
          userId,
          generationLocale: examHintLang,
          source: "exam_hint",
          message: lastUserMessage.substring(0, 100)
        });
        return examHintLang;
      }

      // Priority 3: Message text analysis (accents, word frequency)
      const messageLang = detectMessageLanguage(lastUserMessage);
      if (messageLang) {
        logger.api("Generation locale from message analysis", {
          userId,
          generationLocale: messageLang,
          source: "message_text",
          message: lastUserMessage.substring(0, 100)
        });
        return messageLang;
      }

      // Priority 4: UI locale fallback (frontend context.language)
      if (context.language) {
        logger.api("Generation locale from frontend context", {
          userId,
          generationLocale: context.language,
          source: "context"
        });
        return context.language;
      }

      // Priority 5: Headers (x-locale, accept-language)
      const headerLocale =
        req.headers.get("x-locale") ||
        req.headers
          .get("accept-language")
          ?.split(",")[0]
          ?.split("-")[0]
          ?.toLowerCase();

      if (headerLocale) {
        logger.api("Generation locale from headers", {
          userId,
          generationLocale: headerLocale,
          source: "headers"
        });
        return headerLocale;
      }

      // Priority 6: Default
      logger.api("Generation locale from default", {
        userId,
        generationLocale: "es",
        source: "default"
      });
      return "es";
    })();

    // Log both locales for debugging
    logger.api("Locale detection complete", {
      userId,
      uiLocale,
      generationLocale,
      localesMatch: uiLocale === generationLocale
    });

    // ========================================================================
    // 7. INITIALIZE LANGSMITH TRACING
    // ========================================================================
    // Clear previous LLM call captures to start fresh
    llmCallCapture.clear();

    const langsmithClient = initializeLangSmithClient();
    let langsmithRunId: string | null = null;
    const tracingStartTime = Date.now();

    if (langsmithClient) {
      langsmithRunId = await createMastraRootRun(langsmithClient, {
        userId,
        uiLocale,
        generationLocale,
        messageCount: messages.length,
        hasDocumentContext: !!(
          context.topicSummaries && context.topicSummaries.length > 0
        ),
        hasExamContext: !!context.existingExam,
      });
    }

    // ========================================================================
    // 8. GET MASTRA AGENT
    // ========================================================================
    const agent = mastra.getAgent("chatOrchestrator");
    if (!agent) {
      logger.error("Orchestrator agent not found");
      return Response.json(
        { error: "Agent configuration error", code: "AGENT_NOT_FOUND" },
        { status: 500 }
      );
    }

    // ========================================================================
    // 8. CREATE SSE STREAM
    // ========================================================================
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Capture steps in real-time for error recovery
        const capturedSteps: unknown[] = [];

        try {
          logger.api("Starting agent generation", { userId, uiLocale, generationLocale });

          // Convert messages to Mastra format (array of content strings)
          const mastraMessages = messages.map((msg) => msg.content);

          // Inject language context (ALWAYS - highest priority instruction)
          // Two distinct languages: UI for responses, Generation for exam content
          const languageContext = `[LANGUAGE_SETTING]
UI Language: ${uiLocale} - Use this for ALL conversational responses to the user
Generation Language: ${generationLocale} - Use this for ALL exam content (questions, options, rationale, tags)

IMPORTANT DISTINCTION:
1. Your responses/messages to the user MUST be in ${uiLocale === 'es' ? 'SPANISH (español)' : 'ENGLISH'}
   - Examples: "Generando examen...", "He creado las preguntas...", progress messages, etc.

2. The exam content (questions, answers, rationale) MUST be in ${generationLocale === 'es' ? 'SPANISH (español)' : 'ENGLISH'}
   - Question text: ${generationLocale === 'es' ? 'Spanish' : 'English'}
   - Answer options: ${generationLocale === 'es' ? 'Spanish' : 'English'}
   - Rationale: ${generationLocale === 'es' ? 'Spanish' : 'English'}
   - Tags: ${generationLocale === 'es' ? 'Spanish' : 'English'}

Generation language (${generationLocale}) has been determined by:
${context.languageOverride && context.languageOverride !== 'auto' ? '✅ USER EXPLICIT OVERRIDE - This is the highest priority, respect it absolutely' : 'Context-aware detection (exam context, hints, or message analysis)'}

DO NOT mix these languages. Responses in ${uiLocale}, exam content in ${generationLocale}.
[/LANGUAGE_SETTING]`;

          mastraMessages.unshift(languageContext);

          logger.api("Language context injected", {
            userId,
            uiLocale,
            generationLocale,
            isUserOverride: context.languageOverride && context.languageOverride !== 'auto'
          });

          // Inject current exam context if available (local-first: frontend is source of truth)
          if (context.existingExam) {
            const examContext = `[CURRENT_EXAM]
The user currently has an exam with the following structure:
${JSON.stringify(context.existingExam.exam, null, 2)}

IMPORTANT: When using regenerateQuestion or addQuestions tools, you MUST pass this exam as the 'currentExam' parameter to maintain topic coherence.
[/CURRENT_EXAM]`;

            // Prepend to messages so agent sees it
            mastraMessages.unshift(examContext);
          }

          // Inject document summaries context if available
          if (context.topicSummaries && context.topicSummaries.length > 0) {
            // Create a compact version of summaries for the message
            // (Only include essential info to avoid overwhelming the model)
            const compactSummaries = context.topicSummaries.map((ts, index) => {
              const rawOverview = ts.summary?.generalOverview || "Document uploaded";

              // SECURITY: Sanitize document content before LLM injection (Issue #35)
              const sanitizeResult = sanitizeDocumentContent(rawOverview, {
                userId,
                documentId: ts.documentId,
                maxLength: 5000, // Per-document limit
              });

              // Log if suspicious content detected
              if (sanitizeResult.hadSuspiciousContent) {
                logger.warn("Prompt injection attempt detected in document", {
                  userId,
                  documentId: ts.documentId,
                  documentIndex: index,
                  patternsDetected: sanitizeResult.patternsDetected,
                  wasTruncated: sanitizeResult.wasTruncated,
                });
              }

              return {
                documentId: ts.documentId,
                overview: sanitizeResult.sanitized, // Use sanitized content
                level: ts.summary?.academicLevel || "Unknown",
                topicCount: ts.summary?.macroTopics?.length || 0,
                wasSanitized: sanitizeResult.hadSuspiciousContent,
              };
            });

            const documentContext = `[DOCUMENT_CONTEXT]
The user has uploaded ${context.topicSummaries.length} document(s):
${compactSummaries
  .map(
    (s, i) => `
Document ${i + 1}:
- Overview: ${s.overview}
- Academic Level: ${s.level}
- Number of topics: ${s.topicCount}
`
  )
  .join("\n")}

INSTRUCTIONS:
- Generate exam questions based on the topics covered in these documents
- Use the overview and academic level to set appropriate difficulty and context
- You do NOT need to pass documentSummaries to the tools (it's optional)
- Focus on creating relevant topics that align with the document content
[/DOCUMENT_CONTEXT]`;

            // Prepend to messages so agent sees it
            mastraMessages.unshift(documentContext);

            logger.api("Document summaries injected", {
              userId,
              summariesCount: context.topicSummaries.length,
              documentIds: context.topicSummaries.map((s) => s.documentId),
              sanitizedCount: compactSummaries.filter(s => s.wasSanitized).length,
            });
          }

          logger.api("Agent generation starting", {
            userId,
            totalMessages: mastraMessages.length,
            hasExamContext: !!context.existingExam,
            hasDocumentContext:
              !!context.topicSummaries && context.topicSummaries.length > 0,
          });

          // Track timing for agent.generate call
          const agentStartTime = Date.now();

          // Generate with agent
          const result = await agent.generate(mastraMessages, {
            maxSteps: 15, // Increased to ensure all workflow steps complete
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStepFinish: async (event: any) => {
              const stepEvent = event as MastraStepEvent;

              // Capture step for error recovery
              capturedSteps.push(stepEvent);

              // Track timing for first step (agent first response)
              if (capturedSteps.length === 1) {
                const firstStepLatency = Date.now() - agentStartTime;
                logger.perf("Agent first step received", {
                  userId,
                  latency: firstStepLatency,
                  latencySeconds: (firstStepLatency / 1000).toFixed(2),
                  toolName: stepEvent.toolCalls?.[0]?.payload?.toolName,
                });
              }

              // Track step in LangSmith
              if (langsmithClient && langsmithRunId) {
                const stepNumber = capturedSteps.length;
                const toolName = stepEvent.toolCalls?.[0]?.payload?.toolName;

                // Track the agent step and get its run ID (fire-and-forget)
                const stepRunId = trackAgentStep(langsmithClient, langsmithRunId, {
                  stepNumber,
                  toolName,
                  text: stepEvent.text,
                  userId,
                });

                // If the step has text, it means the LLM generated a response
                if (stepRunId && stepEvent.text) {
                  // Get the latest captured LLM call from the proxy
                  const capturedCall = llmCallCapture.getLatest();

                  // Track the LLM call that generated this response (fire-and-forget)
                  trackLLMCall(langsmithClient, stepRunId, {
                    model: capturedCall?.model || process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite",
                    messages: capturedCall?.messages || [
                      { role: "system", content: "Agent instructions (see full instructions in agent config)" },
                      { role: "user", content: `Step ${stepNumber}: ${toolName ? `Execute tool ${toolName}` : "Generate response"}` }
                    ],
                    response: capturedCall?.response || stepEvent.text,
                    toolCalls: stepEvent.toolCalls?.map(tc => ({
                      name: tc.payload?.toolName || "unknown",
                      args: tc.payload?.args || {}
                    })),
                    promptTokens: capturedCall?.usage?.promptTokens,
                    completionTokens: capturedCall?.usage?.completionTokens,
                    totalTokens: capturedCall?.usage?.totalTokens,
                    duration: capturedCall ? Date.now() - capturedCall.timestamp : undefined,
                    userId,
                  });
                }

                // If the step has tool calls, track them as well (fire-and-forget)
                if (stepRunId && stepEvent.toolCalls && stepEvent.toolCalls.length > 0) {
                  for (const toolCall of stepEvent.toolCalls) {
                    if (toolCall.payload?.toolName) {
                      trackToolExecution(langsmithClient, stepRunId, {
                        toolName: toolCall.payload.toolName,
                        inputs: (toolCall.payload.args as Record<string, unknown>) || ({} as Record<string, unknown>),
                        success: true,
                        userId,
                      });
                    }
                  }
                }
              }

              // Log step completion
              logger.perf("Agent step completed", {
                userId,
                text: stepEvent.text?.slice(0, 100),
                toolCalls: stepEvent.toolCalls?.length || 0,
              });

              // Send progress event to client
              // IMPORTANT: Use i18n keys, not hardcoded text
              // Determine message key based on tool being executed
              let messageKey = "chat.progress.step";
              const firstToolCall = stepEvent.toolCalls?.[0];

              if (firstToolCall?.payload?.toolName) {
                const toolName = firstToolCall.payload.toolName;
                const toolToMessageKey: Record<string, string> = {
                  planExamGeneration: "chat.progress.planning",
                  generateQuestionsInBulk: "chat.progress.generating",
                  validateAndOrganizeExam: "chat.progress.validating",
                  randomizeOptions: "chat.progress.randomizing",
                  regenerateQuestion: "chat.progress.regenerating",
                  addQuestions: "chat.progress.adding",
                  modifyMultipleQuestions: "chat.progress.modifying_batch",
                };

                messageKey = toolToMessageKey[toolName] || "chat.progress.step";
              }

              const progressData = {
                type: "progress",
                messageKey,
                text: stepEvent.text,
                toolCalls: stepEvent.toolCalls?.map((tc) => ({
                  name: tc.payload?.toolName,
                  args: tc.payload?.args,
                })),
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
              );
            },
          });

          // Extract exam result from tool calls
          // Look for exam output in priority order:
          // 1. validateAndOrganizeExam (ideal - validated exam)
          // 2. randomizeOptions (has exam structure)
          // 3. generateQuestionsInBulk (has questions array)
          // 4. regenerateQuestion (single question - needs fusion)
          // 5. addQuestions (new questions - needs fusion)

          // Log total agent generation time
          const totalAgentTime = Date.now() - agentStartTime;
          logger.perf("Agent generation completed", {
            userId,
            totalTime: totalAgentTime,
            totalTimeSeconds: (totalAgentTime / 1000).toFixed(2),
            stepCount: capturedSteps.length,
          });

          let examResult = null;
          const toolPriority = [
            "validateAndOrganizeExam",
            "randomizeOptions",
            "generateQuestionsInBulk",
            "modifyMultipleQuestions",
            "regenerateQuestion",
            "addQuestions",
          ];

          // Type-safe access to result properties
          const steps = (result as { steps?: unknown[] }).steps;

          // Log top-level result structure
          logger.api("Top-level result keys", {
            userId,
            resultKeys: Object.keys(result as object),
            hasSteps: !!steps,
            stepsLength: Array.isArray(steps) ? steps.length : 0,
          });

          // Log raw steps structure for debugging
          if (steps && Array.isArray(steps)) {
            logger.api("Raw steps structure", {
              userId,
              stepCount: steps.length,
              stepsDetail: steps.map((s, idx) => {
                const step = s as Record<string, unknown>;
                return {
                  stepIndex: idx,
                  keys: Object.keys(step),
                  hasToolCalls: !!step.toolCalls,
                  toolCallsType: Array.isArray(step.toolCalls)
                    ? "array"
                    : typeof step.toolCalls,
                  toolCallsLength: Array.isArray(step.toolCalls)
                    ? step.toolCalls.length
                    : 0,
                  firstToolCall:
                    Array.isArray(step.toolCalls) && step.toolCalls.length > 0
                      ? JSON.stringify(step.toolCalls[0]).substring(0, 200)
                      : null,
                };
              }),
            });

            // Log last step summary (removed verbose fullStep to reduce log pollution)
            if (steps.length > 0) {
              const lastStep = steps[steps.length - 1] as Record<
                string,
                unknown
              >;
              logger.api("Last step summary", {
                userId,
                stepType: lastStep.stepType,
                hasText: !!lastStep.text,
                hasToolCalls: Array.isArray(lastStep.toolCalls) && lastStep.toolCalls.length > 0,
                finishReason: lastStep.finishReason,
              });
            }
          }

          // Log all tool calls for debugging
          let toolCallsExecuted: string[] = [];
          if (steps && Array.isArray(steps)) {
            toolCallsExecuted = steps
              .flatMap((s) => {
                const step = s as {
                  toolCalls?: Array<{
                    payload?: { toolName?: string };
                  }>;
                };
                return (
                  step.toolCalls?.map((tc) => tc.payload?.toolName || "") || []
                );
              })
              .filter((tc) => tc !== "");

            logger.api("Tool calls executed", {
              userId,
              stepCount: steps.length,
              toolCalls: toolCallsExecuted,
            });
          }

          if (steps && Array.isArray(steps) && steps.length > 0) {
            // Try each tool in priority order
            for (const toolName of toolPriority) {
              // Search from last to first step
              for (let i = steps.length - 1; i >= 0; i--) {
                const step = steps[i] as {
                  text?: string;
                  toolCalls?: Array<{
                    type?: string;
                    payload?: {
                      toolCallId?: string;
                      toolName?: string;
                      args?: unknown;
                    };
                  }>;
                  toolResults?: Array<{
                    type?: string;
                    payload?: {
                      toolCallId?: string;
                      result?: unknown;
                    };
                  }>;
                };

                logger.api("Checking step for tool result", {
                  userId,
                  stepIndex: i,
                  lookingFor: toolName,
                  hasToolCalls: !!step.toolCalls,
                  hasToolResults: !!step.toolResults,
                  toolCallsCount: step.toolCalls?.length || 0,
                  toolResultsCount: step.toolResults?.length || 0,
                });

                // Match toolCalls with toolResults
                if (
                  step.toolCalls &&
                  step.toolResults &&
                  step.toolCalls.length > 0
                ) {
                  for (const toolCall of step.toolCalls) {
                    const actualToolName = toolCall.payload?.toolName;
                    const toolCallId = toolCall.payload?.toolCallId;

                    if (actualToolName === toolName) {
                      // Find matching result
                      const matchingResult = step.toolResults.find(
                        (tr) => tr.payload?.toolCallId === toolCallId
                      );

                      logger.api("Inspecting tool call and result", {
                        userId,
                        toolCallName: actualToolName,
                        toolCallId,
                        hasMatchingResult: !!matchingResult,
                        lookingFor: toolName,
                        matches: actualToolName === toolName,
                      });

                      if (matchingResult?.payload?.result) {
                        const result = matchingResult.payload.result;

                        // Handle different tool output formats
                        if (toolName === "generateQuestionsInBulk") {
                          // generateQuestionsInBulk returns { questions: [...], metadata: {...} }
                          // Automatically execute validate + randomize to avoid agent having to pass large arrays
                          const bulkResult = result as {
                            questions?: unknown[];
                            metadata?: {
                              totalRequested?: number;
                              totalGenerated?: number;
                              errors?: string[];
                            };
                          };

                          // Check for generation errors and notify user
                          if (bulkResult.metadata?.errors && bulkResult.metadata.errors.length > 0) {
                            logger.warn("Bulk generation had errors", {
                              userId,
                              totalRequested: bulkResult.metadata.totalRequested,
                              totalGenerated: bulkResult.metadata.totalGenerated,
                              errorCount: bulkResult.metadata.errors.length,
                              errors: bulkResult.metadata.errors,
                            });

                            // Send warning to frontend
                            const warningData = {
                              type: "warning",
                              message: `⚠️ Generación parcial: ${bulkResult.metadata.totalGenerated}/${bulkResult.metadata.totalRequested} preguntas completadas. ${bulkResult.metadata.errors.length} chunk(s) fallaron.`,
                              details: bulkResult.metadata.errors,
                            };

                            controller.enqueue(
                              encoder.encode(`data: ${JSON.stringify(warningData)}\n\n`)
                            );
                          }

                          if (
                            bulkResult.questions &&
                            Array.isArray(bulkResult.questions) &&
                            bulkResult.questions.length > 0
                          ) {
                            logger.api(
                              "Auto-executing validate + randomize after bulk generation",
                              {
                                userId,
                                questionCount: bulkResult.questions.length,
                                totalRequested: bulkResult.metadata?.totalRequested,
                              }
                            );

                            const autoProcessingStartTime = Date.now();

                            try {
                              // Import tools dynamically
                              const {
                                validateAndOrganizeExamTool,
                                randomizeOptionsTool,
                              } = await import("@/lib/ai/mastra/tools");

                              // Step 1: Validate
                              const validateResult =
                                await validateAndOrganizeExamTool.execute({
                                  context: {
                                    questions: bulkResult.questions as Record<
                                      string,
                                      unknown
                                    >[],
                                    metadata: {
                                      title: "",
                                      subject: "",
                                      level: "",
                                      language: generationLocale,
                                    },
                                    normalizeIds: true,
                                    applySanitization: true,
                                  },
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  runtimeContext: null as any,
                                });

                              logger.api("Auto-validate completed", {
                                userId,
                                validQuestions:
                                  validateResult.metadata.validQuestions,
                                correctionsApplied:
                                  validateResult.metadata.correctionsApplied,
                              });

                              // Step 2: Randomize
                              const randomizeResult =
                                await randomizeOptionsTool.execute({
                                  context: {
                                    exam: validateResult.exam,
                                    multipleChoiceOnly: true,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  } as any,
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  runtimeContext: null as any,
                                });

                              logger.api("Auto-randomize completed", {
                                userId,
                                questionsRandomized:
                                  randomizeResult.metadata
                                    ?.questionsRandomized ?? 0,
                              });

                              // Track auto-processing in LangSmith (fire-and-forget)
                              if (langsmithClient && langsmithRunId) {
                                const autoProcessingDuration =
                                  Date.now() - autoProcessingStartTime;
                                trackAutoProcessing(
                                  langsmithClient,
                                  langsmithRunId,
                                  {
                                    questionCount: bulkResult.questions.length,
                                    validQuestions:
                                      validateResult.metadata.validQuestions,
                                    questionsRandomized:
                                      randomizeResult.metadata
                                        ?.questionsRandomized ?? 0,
                                    correctionsApplied:
                                      validateResult.metadata
                                        .correctionsApplied,
                                    duration: autoProcessingDuration,
                                    userId,
                                  }
                                );
                              }

                              // Set final result
                              examResult = randomizeResult.exam;
                            } catch (autoError) {
                              logger.error(
                                "Auto validate/randomize failed, using raw questions",
                                {
                                  error: autoError,
                                  userId,
                                }
                              );

                              // Fallback: use raw questions
                              examResult = {
                                exam: {
                                  title: "",
                                  subject: "",
                                  level: "",
                                  language: generationLocale,
                                  questions: bulkResult.questions,
                                },
                              };
                            }
                          }
                        } else if (toolName === "regenerateQuestion") {
                          // regenerateQuestion returns { question: {...}, metadata: { questionId, changes } }
                          // We need to merge it with existing exam
                          const regenerateResult = result as {
                            question?: unknown;
                            metadata?: {
                              questionId?: string;
                              changes?: string;
                            };
                          };

                          if (
                            regenerateResult.question &&
                            regenerateResult.metadata?.questionId &&
                            context.existingExam
                          ) {
                            const updatedQuestions =
                              context.existingExam.exam.questions.map(
                                (q: { id: string }) =>
                                  q.id === regenerateResult.metadata?.questionId
                                    ? regenerateResult.question
                                    : q
                              );

                            examResult = {
                              exam: {
                                ...context.existingExam.exam,
                                questions: updatedQuestions,
                              },
                            };

                            logger.api(
                              "Merged regenerated question with existing exam",
                              {
                                userId,
                                questionId:
                                  regenerateResult.metadata.questionId,
                                totalQuestions: updatedQuestions.length,
                              }
                            );
                          } else {
                            logger.warn(
                              "regenerateQuestion result incomplete or no existing exam",
                              {
                                userId,
                                hasQuestion: !!regenerateResult.question,
                                hasQuestionId:
                                  !!regenerateResult.metadata?.questionId,
                                hasExistingExam: !!context.existingExam,
                              }
                            );
                          }
                        } else if (toolName === "modifyMultipleQuestions") {
                          // modifyMultipleQuestions returns { exam: {...}, metadata: { modifiedIds, ... } }
                          // We need to merge modified questions with existing exam
                          const batchResult = result as {
                            exam?: {
                              exam?: {
                                questions?: unknown[];
                              };
                            };
                            metadata?: {
                              modifiedIds?: string[];
                              failedIds?: string[];
                            };
                          };

                          if (
                            batchResult.exam?.exam?.questions &&
                            Array.isArray(batchResult.exam.exam.questions) &&
                            context.existingExam
                          ) {
                            // Merge modified questions back into existing exam
                            const modifiedQuestionsMap = new Map(
                              batchResult.exam.exam.questions.map((q) => [
                                (q as { id: string }).id,
                                q,
                              ])
                            );

                            const updatedQuestions =
                              context.existingExam.exam.questions.map(
                                (q: { id: string }) => {
                                  const modifiedVersion = modifiedQuestionsMap.get(
                                    q.id
                                  );
                                  return modifiedVersion || q;
                                }
                              );

                            examResult = {
                              exam: {
                                ...context.existingExam.exam,
                                questions: updatedQuestions,
                              },
                            };

                            logger.api(
                              "Merged batch modified questions with existing exam",
                              {
                                userId,
                                modifiedIds: batchResult.metadata?.modifiedIds,
                                failedIds: batchResult.metadata?.failedIds,
                                totalQuestions: updatedQuestions.length,
                              }
                            );
                          } else {
                            logger.warn(
                              "modifyMultipleQuestions result incomplete or no existing exam",
                              {
                                userId,
                                hasExam: !!batchResult.exam?.exam,
                                hasQuestions: !!batchResult.exam?.exam?.questions,
                                hasExistingExam: !!context.existingExam,
                              }
                            );
                          }
                        } else if (toolName === "addQuestions") {
                          // addQuestions returns { questions: [...], metadata: {...} }
                          // IMPORTANT: When there are MULTIPLE addQuestions calls (sequential),
                          // we need to accumulate ALL of them, not just the last one.

                          // Collect ALL addQuestions results in chronological order
                          const allAddResults: Array<{
                            questions: unknown[];
                            metadata?: { requested?: number; generated?: number };
                          }> = [];

                          // Search ALL steps in FORWARD order (chronological)
                          for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
                            const currentStep = steps[stepIdx] as {
                              toolCalls?: Array<{
                                type?: string;
                                payload?: {
                                  toolCallId?: string;
                                  toolName?: string;
                                  args?: unknown;
                                };
                              }>;
                              toolResults?: Array<{
                                type?: string;
                                payload?: {
                                  toolCallId?: string;
                                  result?: unknown;
                                };
                              }>;
                            };

                            if (currentStep.toolCalls && currentStep.toolResults) {
                              for (const tc of currentStep.toolCalls) {
                                if (tc.payload?.toolName === "addQuestions") {
                                  const matchingResult = currentStep.toolResults.find(
                                    (tr) => tr.payload?.toolCallId === tc.payload?.toolCallId
                                  );

                                  if (matchingResult?.payload?.result) {
                                    const addResult = matchingResult.payload.result as {
                                      questions?: unknown[];
                                      metadata?: { requested?: number; generated?: number };
                                    };

                                    if (addResult.questions && Array.isArray(addResult.questions)) {
                                      allAddResults.push({
                                        questions: addResult.questions,
                                        metadata: addResult.metadata,
                                      });
                                    }
                                  }
                                }
                              }
                            }
                          }

                          // Merge ALL accumulated results
                          if (allAddResults.length > 0 && context.existingExam) {
                            const allNewQuestions = allAddResults.flatMap((r) => r.questions);

                            examResult = {
                              exam: {
                                ...context.existingExam.exam,
                                questions: [
                                  ...context.existingExam.exam.questions,
                                  ...allNewQuestions,
                                ],
                              },
                            };

                            logger.api(
                              "Merged ALL addQuestions results with existing exam",
                              {
                                userId,
                                addQuestionsCalls: allAddResults.length,
                                questionsPerCall: allAddResults.map((r) => r.questions.length),
                                totalAdded: allNewQuestions.length,
                                finalTotalQuestions: examResult.exam.questions.length,
                              }
                            );
                          } else {
                            logger.warn(
                              "No addQuestions results found or no existing exam",
                              {
                                userId,
                                addResultsCount: allAddResults.length,
                                hasExistingExam: !!context.existingExam,
                              }
                            );
                          }
                        } else if (toolName === "validateAndOrganizeExam") {
                          // validateAndOrganizeExam returns { exam: ExamSchema, corrections, metadata }
                          // Extract just the ExamSchema
                          const validateResult = result as { exam?: unknown };
                          examResult = validateResult.exam || result;
                        } else {
                          // Other tools return exam directly
                          examResult = result;
                        }

                        logger.api("Exam result extracted from tool result", {
                          userId,
                          toolName,
                          hasExamStructure: !!examResult,
                        });
                        break;
                      }
                    }
                  }
                  if (examResult) break;
                }
              }
              if (examResult) break;
            }
          }

          // Always execute randomization (agent no longer has randomizeOptions tool)
          // If validation wasn't executed by agent, we'll do it here too
          const needsValidation =
            examResult &&
            !toolCallsExecuted.includes("validateAndOrganizeExam");
          const needsRandomization = examResult && true; // Always randomize

          if (needsValidation || needsRandomization) {
            logger.api("Manually executing fallback pipeline", {
              userId,
              needsValidation,
              needsRandomization,
              toolCallsFound: toolCallsExecuted,
            });

            try {
              // Get the tools
              const { validateAndOrganizeExamTool, randomizeOptionsTool } =
                await import("@/lib/ai/mastra/tools");

              // Extract questions from exam result
              const examData = examResult as {
                exam?: { questions?: unknown[]; exam?: unknown };
                corrections?: unknown[];
                metadata?: unknown;
              };

              // Extract ExamSchema from validateAndOrganizeExam result
              // validateAndOrganizeExam returns { exam: ExamSchema, corrections, metadata }
              // We need just the ExamSchema for randomization
              let examToRandomize = examData.exam || examResult;

              // Log extracted exam structure
              logger.api("Extracted exam structure before pipeline", {
                userId,
                examResultKeys: examResult ? Object.keys(examResult) : [],
                examToRandomizeKeys: examToRandomize
                  ? Object.keys(examToRandomize as object)
                  : [],
                hasExam: !!(examResult as { exam?: unknown }).exam,
              });

              // Step 1: Validate if needed
              if (
                needsValidation &&
                examData.exam?.questions &&
                validateAndOrganizeExamTool?.execute
              ) {
                const validateResult =
                  await validateAndOrganizeExamTool.execute({
                    context: {
                      questions: examData.exam.questions as Record<
                        string,
                        unknown
                      >[],
                      metadata: {
                        title: "",
                        subject: "",
                        level: "",
                        language: generationLocale,
                      },
                      normalizeIds: true,
                      applySanitization: true,
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    runtimeContext: null as any,
                  });

                logger.api("Manual validate completed", {
                  userId,
                  validQuestions: validateResult.metadata.validQuestions,
                });

                examToRandomize = validateResult.exam;
              }

              // Step 2: Always randomize
              if (examToRandomize && randomizeOptionsTool?.execute) {
                logger.api("Passing to randomize", {
                  userId,
                  examToRandomizeKeys: Object.keys(examToRandomize as object),
                });

                try {
                  const randomizeResult = await randomizeOptionsTool.execute({
                    context: {
                      exam: examToRandomize, // examToRandomize already has correct structure { exam: { questions } }
                      multipleChoiceOnly: true,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    runtimeContext: null as any,
                  });

                  // Log structure for debugging
                  logger.api("Randomize result structure", {
                    userId,
                    resultKeys: Object.keys(randomizeResult),
                    hasExam: !!randomizeResult.exam,
                    hasMetadata: !!randomizeResult.metadata,
                    examKeys: randomizeResult.exam
                      ? Object.keys(randomizeResult.exam as object)
                      : [],
                  });

                  logger.api("Manual randomize completed", {
                    userId,
                    questionsRandomized:
                      randomizeResult.metadata?.questionsRandomized ??
                      "unknown",
                  });

                  // Update exam result with randomized version
                  // randomizeResult = { exam: ExamSchema, metadata }
                  // We only need the ExamSchema part: { exam: { title, questions } }
                  if (randomizeResult.exam) {
                    examResult = randomizeResult.exam;
                    logger.api("Exam result updated with randomized version", {
                      userId,
                      examResultKeys: Object.keys(examResult as object),
                    });
                  } else {
                    logger.warn(
                      "Randomize returned no exam, keeping original examResult",
                      {
                        userId,
                        hadExamBefore: !!examResult,
                      }
                    );
                  }
                } catch (randomizeError) {
                  logger.error(
                    "Randomization failed, using non-randomized exam",
                    {
                      userId,
                      error: randomizeError,
                      hadExamBefore: !!examResult,
                    }
                  );
                  // Keep examResult as is (non-randomized but valid)
                }
              }
            } catch (error) {
              logger.error("Manual pipeline execution failed", {
                error,
                userId,
              });
              // Continue with original examResult
            }
          }

          // If exam result found, send as JSON string, otherwise send agent text
          const resultText = (result as { text?: string }).text || "";
          const finishReason = (result as { finishReason?: string })
            .finishReason;

          // Debug examResult state before sending
          logger.api("Final examResult state before sending", {
            userId,
            hasExamResult: !!examResult,
            examResultType: typeof examResult,
            examResultKeys: examResult ? Object.keys(examResult as object) : [],
            examResultPreview: examResult
              ? JSON.stringify(examResult).substring(0, 200)
              : "null",
          });

          const resultContent = examResult
            ? JSON.stringify(examResult)
            : resultText;

          // Debug what we're sending (normal path)
          if (examResult) {
            logger.api("Sending exam to frontend (normal path)", {
              userId,
              resultLength: resultContent.length,
              resultPreview: resultContent.substring(0, 200),
              hasExamKey: resultContent.includes('"exam"'),
              hasQuestionsKey: resultContent.includes('"questions"'),
              examResultKeys: Object.keys(examResult),
            });
          } else {
            logger.api("Sending text response to frontend (no exam)", {
              userId,
              textLength: resultText.length,
              textPreview: resultText.substring(0, 200),
              finishReason,
            });
          }

          // Collect tools used for LangSmith
          const toolsUsed: string[] = [];
          if (steps && Array.isArray(steps)) {
            for (const step of steps) {
              const typedStep = step as {
                toolCalls?: Array<{
                  payload?: {
                    toolName?: string;
                  };
                }>;
              };
              if (typedStep.toolCalls) {
                for (const tc of typedStep.toolCalls) {
                  const toolName = tc.payload?.toolName;
                  if (toolName && !toolsUsed.includes(toolName)) {
                    toolsUsed.push(toolName);
                  }
                }
              }
            }
          }

          const questionCount = examResult
            ? (
                (examResult as { exam?: { questions?: unknown[] } })?.exam
                  ?.questions || []
              ).length
            : 0;

          // Finalize LangSmith run
          if (langsmithClient && langsmithRunId) {
            // IMPORTANT: Wait for fire-and-forget child runs to reach LangSmith server
            // before finalizing parent (otherwise parent may close before children arrive)
            await new Promise(resolve => setTimeout(resolve, 500));

            const totalDuration = Date.now() - tracingStartTime;
            await finalizeMastraRun(langsmithClient, langsmithRunId, {
              success: true,
              questionCount,
              stepsExecuted: steps?.length || 0,
              toolsUsed,
              totalDuration,
              userId,
            });
          }

          // Send final result
          const finalData = {
            type: "done",
            messageKey: "chat.progress.completed",
            result: resultContent,
            finishReason,
            steps: steps?.length || 0,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          );

          logger.api("Agent generation completed", {
            userId,
            steps: steps?.length || 0,
            finishReason,
            examGenerated: !!examResult,
          });

          // Increment usage counter BEFORE closing stream
          // This ensures the operation completes before serverless function terminates
          try {
            await TierService.incrementUsage(supabase, userId, "ai_generation", 1);
            logger.api("Usage incremented", { userId });
          } catch (err) {
            logger.error("Failed to increment usage", { error: err, userId });
            // Non-critical error - don't fail the request
          }

          controller.close();
        } catch (error) {
          logger.error("Agent generation error", { error, userId });

          // ================================================================
          // FALLBACK: Try to salvage partial results from captured steps
          // ================================================================
          // If the agent failed during randomization but successfully
          // completed validation, we can still recover the exam
          let recoveredExam = null;

          try {
            // Use captured steps from onStepFinish
            if (capturedSteps.length > 0) {
              logger.api("Attempting to recover from partial results", {
                userId,
                stepCount: capturedSteps.length,
              });

              // Try to extract generated questions from steps (before validation failed)
              // Look for generateQuestionsInBulk result to recover from
              for (let i = capturedSteps.length - 1; i >= 0; i--) {
                const step = capturedSteps[i] as {
                  toolCalls?: Array<{
                    payload?: {
                      toolCallId?: string;
                      toolName?: string;
                    };
                  }>;
                  toolResults?: Array<{
                    payload?: {
                      toolCallId?: string;
                      result?: unknown;
                    };
                  }>;
                };

                if (step.toolCalls && step.toolResults) {
                  for (const toolCall of step.toolCalls) {
                    const actualToolName = toolCall.payload?.toolName;
                    const toolCallId = toolCall.payload?.toolCallId;

                    // Look for generateQuestionsInBulk result (this completed successfully)
                    if (actualToolName === "generateQuestionsInBulk") {
                      const matchingResult = step.toolResults.find(
                        (tr) => tr.payload?.toolCallId === toolCallId
                      );

                      if (matchingResult?.payload?.result) {
                        logger.api("Found generated questions in error steps", {
                          userId,
                          toolName: actualToolName,
                        });

                        // Execute complete pipeline: validate + randomize
                        const {
                          validateAndOrganizeExamTool,
                          randomizeOptionsTool,
                        } = await import("@/lib/ai/mastra/tools");

                        const bulkResult = matchingResult.payload.result as {
                          questions?: unknown[];
                          metadata?: unknown;
                        };

                        if (
                          bulkResult.questions &&
                          validateAndOrganizeExamTool?.execute &&
                          randomizeOptionsTool?.execute
                        ) {
                          // Step 1: Validate
                          logger.api("Manually executing validate (recovery)", {
                            userId,
                          });

                          const validateResult =
                            await validateAndOrganizeExamTool.execute({
                              context: {
                                questions: bulkResult.questions as Record<
                                  string,
                                  unknown
                                >[],
                                metadata: {
                                  title: "",
                                  subject: "",
                                  level: "",
                                  language: generationLocale,
                                },
                                normalizeIds: true,
                                applySanitization: true,
                              },
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              runtimeContext: null as any,
                            });

                          logger.api("Manual validate completed (recovery)", {
                            userId,
                            validQuestions:
                              validateResult.metadata.validQuestions,
                          });

                          // Step 2: Randomize
                          // validateResult.exam already has correct structure: { exam: { questions: [] } }
                          const examToPass = validateResult.exam;

                          logger.api(
                            "Manually executing randomize (recovery)",
                            {
                              userId,
                              examToPassKeys: examToPass
                                ? Object.keys(examToPass)
                                : [],
                              hasExamKey: !!(examToPass as { exam?: unknown })
                                ?.exam,
                            }
                          );

                          const randomizeResult =
                            await randomizeOptionsTool.execute({
                              context: {
                                exam: examToPass,
                                multipleChoiceOnly: true,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              } as any,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              runtimeContext: null as any,
                            });

                          logger.api("Manual randomize completed (recovery)", {
                            userId,
                            questionsRandomized:
                              randomizeResult.metadata?.questionsRandomized ??
                              "unknown",
                          });

                          // randomizeResult.exam has structure: { exam: { questions: [] } }
                          recoveredExam = randomizeResult.exam;

                          // Debug recovered exam structure
                          const recoveredQuestionCount = (
                            (
                              recoveredExam as {
                                exam?: { questions?: unknown[] };
                              }
                            )?.exam?.questions || []
                          ).length;

                          logger.api("Successfully recovered exam from error", {
                            userId,
                            recoveredExamKeys: recoveredExam
                              ? Object.keys(recoveredExam)
                              : [],
                            hasExam: !!(recoveredExam as { exam?: unknown })
                              ?.exam,
                            hasQuestions: Array.isArray(
                              (
                                recoveredExam as {
                                  exam?: { questions?: unknown[] };
                                }
                              )?.exam?.questions
                            ),
                            questionCount: recoveredQuestionCount,
                            // More detailed logging
                            examStructure: recoveredExam
                              ? JSON.stringify(recoveredExam).substring(0, 300)
                              : "null",
                          });

                          // Track recovery in LangSmith (fire-and-forget)
                          if (langsmithClient && langsmithRunId) {
                            trackRecovery(
                              langsmithClient,
                              langsmithRunId,
                              {
                                originalError: String(error),
                                recoveredQuestions: recoveredQuestionCount,
                                stepCount: capturedSteps.length,
                                success: recoveredQuestionCount > 0,
                                userId,
                              }
                            );
                          }

                          break;
                        }
                      }
                    }
                  }
                  if (recoveredExam) break;
                }
              }
            }
          } catch (recoveryError) {
            logger.error("Failed to recover from error", {
              error: recoveryError,
              userId,
            });
          }

          // If we recovered an exam, send it as success
          if (recoveredExam) {
            // Verify structure before sending
            const hasValidStructure = !!(recoveredExam as { exam?: unknown })
              ?.exam;
            const questionCount = (
              (recoveredExam as { exam?: { questions?: unknown[] } })?.exam
                ?.questions || []
            ).length;

            logger.api("Sending recovered exam to frontend", {
              userId,
              hasValidStructure,
              questionCount,
              recoveredExamKeys: Object.keys(recoveredExam),
            });

            // Finalize LangSmith run (recovery success)
            if (langsmithClient && langsmithRunId) {
              // Wait for child runs to reach server
              await new Promise(resolve => setTimeout(resolve, 500));

              const totalDuration = Date.now() - tracingStartTime;
              const toolsUsed: string[] = [];
              for (const step of capturedSteps) {
                const typedStep = step as {
                  toolCalls?: Array<{
                    payload?: {
                      toolName?: string;
                    };
                  }>;
                };
                if (typedStep.toolCalls) {
                  for (const tc of typedStep.toolCalls) {
                    const toolName = tc.payload?.toolName;
                    if (toolName && !toolsUsed.includes(toolName)) {
                      toolsUsed.push(toolName);
                    }
                  }
                }
              }

              await finalizeMastraRun(langsmithClient, langsmithRunId, {
                success: true,
                questionCount,
                stepsExecuted: capturedSteps.length,
                toolsUsed,
                totalDuration,
                recovered: true,
                userId,
              });
            }

            const resultString = JSON.stringify(recoveredExam);

            const successData = {
              type: "done",
              messageKey: "chat.progress.completed",
              result: resultString,
              finishReason: "recovered",
              steps: 4,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(successData)}\n\n`)
            );

            logger.api("Agent generation recovered from error", {
              userId,
              examGenerated: true,
            });

            // Increment usage counter BEFORE closing stream
            // This ensures the operation completes before serverless function terminates
            try {
              await TierService.incrementUsage(supabase, userId, "ai_generation", 1);
              logger.api("Usage incremented", { userId });
            } catch (err) {
              logger.error("Failed to increment usage", {
                error: err,
                userId,
              });
              // Non-critical error - don't fail the request
            }

            controller.close();
          } else {
            // No recovery possible, send error

            // Finalize LangSmith run (error)
            if (langsmithClient && langsmithRunId) {
              // Wait for child runs to reach server
              await new Promise(resolve => setTimeout(resolve, 500));

              const totalDuration = Date.now() - tracingStartTime;
              const toolsUsed: string[] = [];
              for (const step of capturedSteps) {
                const typedStep = step as {
                  toolCalls?: Array<{
                    payload?: {
                      toolName?: string;
                    };
                  }>;
                };
                if (typedStep.toolCalls) {
                  for (const tc of typedStep.toolCalls) {
                    const toolName = tc.payload?.toolName;
                    if (toolName && !toolsUsed.includes(toolName)) {
                      toolsUsed.push(toolName);
                    }
                  }
                }
              }

              await finalizeMastraRun(langsmithClient, langsmithRunId, {
                success: false,
                questionCount: 0,
                stepsExecuted: capturedSteps.length,
                toolsUsed,
                totalDuration,
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
              });
            }

            const errorData = {
              type: "error",
              messageKey: "chat.error.generation",
              error: error instanceof Error ? error.message : "Unknown error",
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
            );
            controller.close();
          }
        }
      },
    });

    // ========================================================================
    // 9. RETURN SSE RESPONSE
    // ========================================================================
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    logger.error("Unexpected error in chat-mastra", { error });
    return Response.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
