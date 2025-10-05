import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

// Import refactored modules
import { SummarizeRequestSchema, TopicSummaryResult } from "@/lib/ai/document-summarize/schemas";
import { invokeTextSummarization, invokeVisionSummarization } from "@/lib/ai/document-summarize/chains";
import { validateBasicStructure } from "@/lib/ai/document-summarize/json-parser";
import { createCostMetadata } from "@/lib/ai/document-summarize/openrouter";
import {
  RootRunCapture,
  initializeLangSmithTracing,
  finalizeLangSmithRun,
  endLangSmithRunWithError,
} from "@/lib/ai/document-summarize/langsmith";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  logger.api("/api/documents/summarize:START");

  return await handleSummarizeRequest(req, t0);
}

async function handleSummarizeRequest(req: NextRequest, t0: number) {
  let traceMetadata: Record<string, string | number | boolean | undefined> = {};

  // Initialize LangSmith tracing
  logger.api("/api/documents/summarize:Initializing LangSmith");
  const { client: langsmithClient, tracer, rootRunId } = await initializeLangSmithTracing();
  const rootCapture = new RootRunCapture();

  logger.api("/api/documents/summarize:LangSmith initialized", {
    hasClient: !!langsmithClient,
    hasTracer: !!tracer,
    rootRunId,
  });

  try {
    // 1) Parse and validate request
    const body = await req.json();
    const parsed = SummarizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("Invalid request payload", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, imageData, options = {} } = parsed.data;
    const isImageMode = !!imageData && typeof imageData === "string";

    // 2) Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    // 3) Build trace metadata
    traceMetadata = {
      mode: isImageMode ? "vision" : "text",
      has_text: !!text,
      has_image: !!imageData,
      model: options.model || (isImageMode ? process.env.OPENAI_IMAGE_SUMMARY_MODEL : process.env.OPENAI_MODEL) || "auto",
    };
    logger.api("/api/documents/summarize:trace_metadata", traceMetadata);

    const callbacks = tracer ? [tracer, rootCapture] : [rootCapture];

    let result: TopicSummaryResult;
    let generationId: string | undefined;
    let generationStats: any = null;

    // 4) Execute appropriate chain
    if (isImageMode) {
      // Vision mode
      const visionModel = options.model || process.env.OPENAI_IMAGE_SUMMARY_MODEL || "openrouter/auto";
      const temperature = options.temperature ?? 0.2;
      const maxOutputTokens = options.maxOutputTokens ?? 20000;

      logger.api("/api/documents/summarize:Invoking vision chain", {
        model: visionModel,
        temperature,
        maxOutputTokens,
      });

      const visionResult = await invokeVisionSummarization({
        imageData: imageData!,
        model: visionModel,
        temperature,
        maxOutputTokens,
        callbacks,
        metadata: traceMetadata,
      });

      result = visionResult.result;
      generationId = visionResult.generationId;
      generationStats = visionResult.stats;
    } else {
      // Text mode
      if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
      }

      const maxChars = options.maxChars || 50000;
      const trimmed = text.length > maxChars ? text.slice(0, maxChars) : text;
      
      // Log if text was truncated
      if (text.length > maxChars) {
        logger.warn("/api/documents/summarize:Text truncated", {
          originalLength: text.length,
          truncatedTo: maxChars,
          charsLost: text.length - maxChars,
          percentLost: Math.round(((text.length - maxChars) / text.length) * 100),
        });
      }
      
      const textModel = options.model || process.env.OPENAI_MODEL || "openrouter/auto";
      const temperature = options.temperature ?? 0.3;
      const maxOutputTokens = options.maxOutputTokens || options.maxTokens || 2200;

      logger.api("/api/documents/summarize:Invoking text chain", {
        model: textModel,
        temperature,
        maxOutputTokens,
        textLength: trimmed.length,
        wasTruncated: text.length > maxChars,
      });

      const textResult = await invokeTextSummarization({
        text: trimmed,
        model: textModel,
        temperature,
        maxOutputTokens,
        callbacks,
        metadata: traceMetadata,
      });

      result = textResult.result;
      generationId = textResult.generationId;
      generationStats = textResult.stats;
    }

    logger.api("/api/documents/summarize:Chain completed", {
      hasResult: !!result,
      generationId,
      hasStats: !!generationStats,
    });

    // 5) Validate basic structure (defensive)
    if (!validateBasicStructure(result)) {
      logger.error("Invalid response structure from AI", { result });
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 502 }
      );
    }

    // 6) Build final metadata
    const finalMetadata = {
      ...traceMetadata,
      success: true,
      duration_ms: Date.now() - t0,
      generation_id: generationId,
      ...(generationStats ? createCostMetadata(generationStats) : {}),
    };

    // 7) Finalize LangSmith run
    if (langsmithClient && rootRunId) {
      logger.api("/api/documents/summarize:Finalizing LangSmith run", { rootRunId });
      await finalizeLangSmithRun(langsmithClient, rootRunId, finalMetadata, {
        summary: result,
      });
      logger.api("/api/documents/summarize:LangSmith run finalized");
    } else {
      logger.warn("/api/documents/summarize:No LangSmith client or rootRunId", {
        hasClient: !!langsmithClient,
        rootRunId,
      });
    }

    logger.api("/api/documents/summarize:final_metadata", finalMetadata);
    logger.perf("/api/documents/summarize:OK", { ms: Date.now() - t0 });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("/api/documents/summarize:ERROR", error);

    // End LangSmith run with error
    if (langsmithClient && rootRunId) {
      await endLangSmithRunWithError(langsmithClient, rootRunId, error);
    }

    const finalMetadata = {
      ...traceMetadata,
      success: false,
      duration_ms: Date.now() - t0,
      error: String(error),
    };
    logger.api("/api/documents/summarize:final_metadata", finalMetadata);

    return NextResponse.json(
      { error: "Internal error", details: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
