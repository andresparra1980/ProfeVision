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
import logger from "@/lib/utils/logger";

// SSE requires Node.js runtime (not Edge)
export const runtime = "nodejs";

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    let messages: any[];
    let context: any;

    try {
      const body = await req.json();
      const validated = ChatRequestSchema.parse(body);
      messages = validated.messages;
      context = validated.context;

      logger.api("Request validated", {
        userId,
        messageCount: messages.length,
        language: context.language,
        numQuestions: context.numQuestions,
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
    // 6. LOCALE DETECTION
    // ========================================================================
    // Priority:
    // 1. context.language (from frontend)
    // 2. x-locale header
    // 3. accept-language header
    // 4. default: "es"
    const locale =
      context.language ||
      req.headers.get("x-locale") ||
      req.headers
        .get("accept-language")
        ?.split(",")[0]
        ?.split("-")[0]
        ?.toLowerCase() ||
      "es";

    logger.api("Locale detected", { userId, locale });

    // ========================================================================
    // 7. GET MASTRA AGENT
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
        try {
          logger.api("Starting agent generation", { userId, locale });

          // Convert messages to Mastra format
          const mastraMessages = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          // Generate with agent
          const result = await agent.generate(mastraMessages, {
            maxSteps: 10,
            onStepFinish: async (event: any) => {
              // Log step completion
              logger.perf("Agent step completed", {
                userId,
                text: event.text?.slice(0, 100),
                toolCalls: event.toolCalls?.length || 0,
              });

              // Send progress event to client
              // IMPORTANT: Use i18n keys, not hardcoded text
              const progressData = {
                type: "progress",
                messageKey: "chat.progress.step",
                text: event.text,
                toolCalls: event.toolCalls?.map((tc: any) => ({
                  name: tc.toolName,
                  args: tc.args,
                })),
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
              );
            },
          });

          // Send final result
          const finalData = {
            type: "done",
            messageKey: "chat.progress.completed",
            result: result.text,
            finishReason: result.finishReason,
            steps: result.steps?.length || 0,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          );

          logger.api("Agent generation completed", {
            userId,
            steps: result.steps?.length || 0,
            finishReason: result.finishReason,
          });

          controller.close();

          // Increment usage counter (async, non-blocking)
          TierService.incrementUsage(supabase, userId, "ai_generation", 1)
            .then(() => {
              logger.api("Usage incremented", { userId });
            })
            .catch((err) => {
              logger.error("Failed to increment usage", { error: err, userId });
            });
        } catch (error) {
          logger.error("Agent generation error", { error, userId });

          // Send error event to client
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
