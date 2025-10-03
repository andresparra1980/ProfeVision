import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import { Callbacks } from "@langchain/core/callbacks/manager";
import logger from "@/lib/utils/logger";
import { buildTextPrompt, buildVisionMessages } from "./prompts";
import { parseJSONResponse } from "./json-parser";
import { TopicSummaryResult } from "./schemas";
import { fetchOpenRouterStats, createCostMetadata, OpenRouterStats } from "./openrouter";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Text-based summarization with LangChain
 */
export async function invokeTextSummarization(params: {
  text: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  callbacks?: Callbacks;
  metadata?: Record<string, unknown>;
}): Promise<{ result: TopicSummaryResult; generationId?: string; stats?: OpenRouterStats }> {
  const {
    text,
    model = process.env.OPENAI_MODEL || "openrouter/auto",
    temperature = 0.3,
    maxOutputTokens = 2200,
    callbacks,
    metadata,
  } = params;

  logger.api("/api/documents/summarize:Text mode", {
    model,
    textLength: text.length,
  });

  const llm = new ChatOpenAI({
    apiKey: OPENROUTER_API_KEY,
    modelName: model,
    temperature,
    maxTokens: maxOutputTokens,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ProfeVision",
      },
    },
    modelKwargs: {
      response_format: { type: "json_object" },
    },
    metadata: {
      endpoint: "/api/documents/summarize",
      feature: "text-summarization",
      ...metadata,
    },
    tags: ["document-summarize", "text-mode"],
  });

  const prompt = buildTextPrompt(text);
  const messages = [
    { role: "system" as const, content: "You are an expert academic content analyzer. Return STRICT JSON ONLY." },
    { role: "user" as const, content: prompt },
  ];

  logger.api("/api/documents/summarize:Invoking LLM", {
    model,
    messageCount: messages.length,
  });

  // Create pipeline: ChatOpenAI -> Cost tracking
  type ChatMsg = { role: "system" | "user"; content: string };
  let generationStats: OpenRouterStats | null = null;

  const fullPipeline = RunnableLambda.from<ChatMsg[], { content: string; generationId?: string }>(
    async (msgs: ChatMsg[], config) => {
      // Execute ChatOpenAI directly (will appear as child node)
      const response = await llm.invoke(msgs, config);
      const content = String(response.content);
      const generationId = response.response_metadata?.id || response.id;

      logger.api("/api/documents/summarize:LLM response received", {
        contentType: typeof content,
        hasContent: !!content,
        generationId,
      });

      // Fetch OpenRouter stats and create cost node
      if (generationId) {
        const stats = await fetchOpenRouterStats(generationId);
        if (stats) {
          generationStats = stats;
          const costMetadata = createCostMetadata(stats);

          // Create a cost tracking node
          await RunnableLambda.from(() => null)
            .withConfig({
              runName: "openrouter_cost",
              metadata: costMetadata,
              tags: ["openrouter", "cost", "document-summarize"],
            })
            .invoke(null, config);
        }
      }

      return { content, generationId };
    }
  );

  // Execute pipeline
  const pipelineResult = await fullPipeline
    .withConfig({
      runName: "document_summarize",
      callbacks,
      tags: ["document-summarize", "text-mode"],
      metadata,
    })
    .invoke(messages);

  const { content, generationId } = pipelineResult;

  const parsed = parseJSONResponse(content);
  if (!parsed.success) {
    throw new Error(parsed.error || "Failed to parse AI response");
  }

  return { result: parsed.data!, generationId, stats: generationStats || undefined };
}

/**
 * Vision-based summarization with LangChain
 */
export async function invokeVisionSummarization(params: {
  imageData: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  callbacks?: Callbacks;
  metadata?: Record<string, unknown>;
}): Promise<{ result: TopicSummaryResult; generationId?: string; stats?: OpenRouterStats }> {
  const {
    imageData,
    model = process.env.OPENAI_IMAGE_SUMMARY_MODEL || "openrouter/auto",
    temperature = 0.2,
    maxOutputTokens = 20000,
    callbacks,
    metadata,
  } = params;

  logger.api("/api/documents/summarize:Vision mode", {
    model,
    hasImage: !!imageData,
  });

  // Validate image format
  if (imageData.startsWith("data:")) {
    const m = imageData.match(/^data:([^;]+);base64,/i);
    const mime = m?.[1] || "";
    const supported = /^(image\/(png|jpe?g|webp|gif))$/i.test(mime);
    if (!supported) {
      logger.warn("Unsupported image mime for vision", { mime });
    }
  }

  const llm = new ChatOpenAI({
    apiKey: OPENROUTER_API_KEY,
    modelName: model,
    temperature,
    maxTokens: maxOutputTokens,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ProfeVision",
      },
    },
    modelKwargs: {
      response_format: { type: "json_object" },
    },
    metadata: {
      endpoint: "/api/documents/summarize",
      feature: "vision-summarization",
      ...metadata,
    },
    tags: ["document-summarize", "vision-mode"],
  });

  const messages = buildVisionMessages(imageData);

  logger.api("/api/documents/summarize:Invoking vision LLM", {
    model,
    messageCount: messages.length,
  });

  // Create pipeline: ChatOpenAI -> Cost tracking
  type VisionMsg = typeof messages;
  let generationStats: OpenRouterStats | null = null;

  const fullPipeline = RunnableLambda.from<VisionMsg, { content: string; generationId?: string }>(
    async (msgs: VisionMsg, config) => {
      // Execute ChatOpenAI directly (will appear as child node)
      const response = await llm.invoke(msgs as any, config);
      const content = String(response.content);
      const generationId = response.response_metadata?.id || response.id;

      logger.api("/api/documents/summarize:Vision LLM response received", {
        contentType: typeof content,
        hasContent: !!content,
        generationId,
      });

      // Fetch OpenRouter stats and create cost node
      if (generationId) {
        const stats = await fetchOpenRouterStats(generationId);
        if (stats) {
          generationStats = stats;
          const costMetadata = createCostMetadata(stats);

          // Create a cost tracking node
          await RunnableLambda.from(() => null)
            .withConfig({
              runName: "openrouter_cost",
              metadata: costMetadata,
              tags: ["openrouter", "cost", "document-summarize"],
            })
            .invoke(null, config);
        }
      }

      return { content, generationId };
    }
  );

  // Execute pipeline
  const pipelineResult = await fullPipeline
    .withConfig({
      runName: "document_summarize",
      callbacks,
      tags: ["document-summarize", "vision-mode"],
      metadata,
    })
    .invoke(messages);

  const { content, generationId } = pipelineResult;

  const parsed = parseJSONResponse(content);
  if (!parsed.success) {
    throw new Error(parsed.error || "Failed to parse AI response");
  }

  return { result: parsed.data!, generationId, stats: generationStats || undefined };
}
