import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/utils/logger";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";

// Import refactored modules
import {
  ChatRequestSchema,
  ExamSchema,
  OpenRouterStats,
} from "@/lib/ai/chat/schemas";
import {
  buildSystemPrompt,
  buildUserInstruction,
  buildLLMMessages,
} from "@/lib/ai/chat/prompts";
import {
  parseAIResponse,
  sanitizeAIExamPayload,
} from "@/lib/ai/chat/json-parser";
import {
  fetchOpenRouterStats,
  createCostMetadata,
} from "@/lib/ai/chat/openrouter";
import {
  RootRunCapture,
  initializeLangSmithTracing,
  finalizeLangSmithRun,
  endLangSmithRunWithError,
} from "@/lib/ai/chat/langsmith";
import { verifyTeacherAuth } from "@/lib/auth/verify-teacher";
import TierService from "@/lib/services/tier-service";

// Env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  logger.api("/api/chat:START");

  return await handleChatRequest(req, t0);
}

async function handleChatRequest(req: NextRequest, t0: number) {
  let traceMetadata: Record<string, string | number | boolean | undefined> = {};
  let generationStats: OpenRouterStats | null = null;

  // Initialize LangSmith tracing
  const { client: langsmithClient, tracer, rootRunId } =
    await initializeLangSmithTracing();
  const rootCapture = new RootRunCapture();

  try {
    // 1) Authentication & Authorization
    let user;
    try {
      const authResult = await verifyTeacherAuth(req);
      user = authResult.user;
    } catch (error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        NO_AUTH_HEADER: { message: "No autorizado", status: 401 },
        SUPABASE_CONFIG_MISSING: {
          message: "Configuración de Supabase incompleta",
          status: 500,
        },
        USER_NOT_AUTHENTICATED: { message: "Usuario no autenticado", status: 401 },
        USER_NOT_TEACHER: {
          message: "Solo los profesores pueden usar este endpoint",
          status: 403,
        },
      };
      const err = errorMap[String(error)] || {
        message: "Error de autenticación",
        status: 401,
      };
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    // Check tier limits for AI generation feature
    try {
      const limitCheck = await TierService.checkFeatureAccess(user.id, 'ai_generation');

      if (!limitCheck.allowed) {
        logger.log('AI generation limit reached for user:', user.id, limitCheck);
        return NextResponse.json(
          {
            error: 'Límite de generaciones de IA alcanzado',
            details: {
              limit: limitCheck.limit,
              used: limitCheck.used,
              tier: limitCheck.tier,
              cycle_end: limitCheck.cycle_end,
            },
          },
          { status: 403 }
        );
      }
    } catch (tierError) {
      logger.error('Error checking tier limits:', tierError);
      // Continue even if tier check fails (don't block existing functionality)
    }

    // 2) Validate request payload
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Payload inválido", parsed.error.flatten());
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { messages, context } = parsed.data;

    // 3) Build trace metadata for LangSmith
    traceMetadata = {
      user_id: user.id,
      language: context.language,
      num_questions: context.numQuestions,
      question_types: context.questionTypes.join(", "),
      difficulty: context.difficulty,
      has_existing_exam: !!context.existingExam,
      num_documents: context.documentIds?.length || 0,
      num_topic_summaries: context.topicSummaries?.length || 0,
      message_count: messages.length,
      model: OPENAI_MODEL,
    };
    logger.api("/api/chat:trace_metadata", traceMetadata);

    // 4) Check OpenRouter API key
    if (!OPENROUTER_API_KEY) {
      logger.error("Falta API Key de OpenRouter");
      return NextResponse.json(
        { error: "Falta API Key de OpenRouter" },
        { status: 500 }
      );
    }

    // 5) Build prompts and messages
    const systemPrompt = buildSystemPrompt(context.language);
    const userInstruction = buildUserInstruction(context);
    const llmMessages = buildLLMMessages(
      context,
      messages,
      systemPrompt,
      userInstruction
    );

    logger.api("/api/chat:LLM request", {
      model: OPENAI_MODEL,
      messageCount: llmMessages.length,
    });

    // 6) Create ChatOpenAI model
    const model = new ChatOpenAI({
      apiKey: OPENROUTER_API_KEY,
      modelName: OPENAI_MODEL,
      temperature: 0.7,
      maxTokens: 16000,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "ProfeVision",
        },
      },
      modelKwargs: {
        response_format: { type: "json_object" },
      },
      metadata: {
        endpoint: "/api/chat",
        feature: "exam-question-generation",
      },
      tags: ["chat-api", "exam-generation"],
    });

    // 7) Create pipeline: ChatOpenAI -> Cost tracking
    type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
    const fullPipeline = RunnableLambda.from<ChatMsg[], { content: unknown }>(
      async (messages: ChatMsg[], config) => {
        // Execute ChatOpenAI directly (will appear as child node)
        const response = await model.invoke(messages, config);
        const content = response.content;
        const generationId = response.response_metadata?.id || response.id;

        logger.api("/api/chat:LLM response received", {
          contentType: typeof content,
          hasContent: !!content,
          generationId,
        });

        // Fetch OpenRouter stats and create cost node
        if (generationId) {
          const stats = await fetchOpenRouterStats(generationId);
          if (stats) {
            generationStats = stats as OpenRouterStats;
            logger.api("/api/chat:Cost analysis", {
              cost: stats.usage || stats.total_cost,
              tokens_prompt: stats.tokens_prompt,
              tokens_completion: stats.tokens_completion,
              generation_time_ms: stats.generation_time,
              model: stats.model,
              provider: stats.provider_name,
            });

            const costMetadata = createCostMetadata(
              generationStats,
              traceMetadata,
              generationId
            );

            // Create cost tracking node with empty input and cost metadata
            await RunnableLambda.from(async () => null)
              .withConfig({
                runName: "openrouter_cost",
                metadata: costMetadata,
                tags: ["openrouter", "cost", "chat-api"],
              })
              .invoke(null, config);
          }
        }

        return { content };
      }
    );

    // 8) Execute pipeline
    const pipelineResult = await fullPipeline
      .withConfig({
        runName: "chat_exam_generation",
        callbacks: tracer ? [tracer, rootCapture] : [rootCapture],
        tags: ["exam-generation", "chat-api"],
        metadata: traceMetadata,
      })
      .invoke(llmMessages);

    const contentUnknownFinal = pipelineResult.content;

    if (contentUnknownFinal == null) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 502 }
      );
    }

    // 9) Parse AI response
    let jsonPayload: unknown;
    try {
      jsonPayload = parseAIResponse(contentUnknownFinal);
    } catch (error) {
      const errorType = String(error);
      if (errorType.includes("JSON_TRUNCATED")) {
        return NextResponse.json(
          {
            error:
              "La IA devolvió JSON incompleto (truncado). Intenta de nuevo.",
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        {
          error: "JSON inválido devuelto por IA",
          raw: String(contentUnknownFinal).slice(0, 2000),
        },
        { status: 422 }
      );
    }

    // 10) Sanitize and validate
    jsonPayload = sanitizeAIExamPayload(jsonPayload);

    const validation = ExamSchema.safeParse(jsonPayload);
    if (!validation.success) {
      const details = validation.error.flatten();
      logger.warn("Contrato inválido de IA", details);
      return NextResponse.json(
        {
          error: "Contrato inválido de IA",
          details,
          raw: jsonPayload,
        },
        { status: 422 }
      );
    }

    // 11) Normalize question IDs
    const data = validation.data;
    const normalized = {
      exam: {
        ...data.exam,
        questions: data.exam.questions.map((q, idx) => ({
          ...q,
          id: `q${idx + 1}`,
        })),
      },
    };

    logger.perf("/api/chat:OK", { ms: Date.now() - t0 });

    // 12) Build final metadata with OpenRouter stats
    const finalMetadata = {
      ...traceMetadata,
      success: true,
      duration_ms: Date.now() - t0,
      questions_generated: normalized.exam.questions.length,
      ...(generationStats
        ? {
            openrouter_generation_id: (generationStats as OpenRouterStats).id,
            openrouter_cost:
              (generationStats as OpenRouterStats).usage ||
              (generationStats as OpenRouterStats).total_cost,
            openrouter_tokens_prompt: (generationStats as OpenRouterStats)
              .tokens_prompt,
            openrouter_tokens_completion: (generationStats as OpenRouterStats)
              .tokens_completion,
            openrouter_native_tokens_prompt: (
              generationStats as OpenRouterStats
            ).native_tokens_prompt,
            openrouter_native_tokens_completion: (
              generationStats as OpenRouterStats
            ).native_tokens_completion,
            openrouter_generation_time_ms: (generationStats as OpenRouterStats)
              .generation_time,
            openrouter_latency_ms: (generationStats as OpenRouterStats).latency,
            openrouter_model: (generationStats as OpenRouterStats).model,
            openrouter_provider: (generationStats as OpenRouterStats)
              .provider_name,
            openrouter_finish_reason: (generationStats as OpenRouterStats)
              .finish_reason,
            openrouter_streamed: (generationStats as OpenRouterStats).streamed,
          }
        : {}),
    };
    logger.api("/api/chat:final_metadata", finalMetadata);

    // 13) Finalize LangSmith runs
    if (langsmithClient && rootCapture.rootRunId) {
      await finalizeLangSmithRun(
        langsmithClient,
        rootCapture.rootRunId,
        finalMetadata,
        { questions_generated: normalized.exam.questions.length }
      );
    }

    if (langsmithClient && rootRunId) {
      await finalizeLangSmithRun(langsmithClient, rootRunId, finalMetadata, {
        questions_generated: normalized.exam.questions.length,
      });
    }

    // Increment AI generation usage count after successful generation
    try {
      await TierService.incrementUsage(user.id, 'ai_generation', 1);
      logger.log('Incremented AI generation usage for user:', user.id);
    } catch (tierError) {
      logger.error('Error incrementing AI generation usage:', tierError);
      // Don't fail the request if usage increment fails
    }

    return NextResponse.json(normalized);
  } catch (error) {
    logger.error("/api/chat:ERROR", error);

    // End root run with error info
    if (langsmithClient && rootRunId) {
      await endLangSmithRunWithError(langsmithClient, rootRunId, error);
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
