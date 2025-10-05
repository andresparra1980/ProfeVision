import logger from "@/lib/utils/logger";

export interface OpenRouterStats {
  id: string;
  model: string;
  streamed?: boolean;
  generation_time?: number;
  created_at?: string;
  tokens_prompt?: number;
  tokens_completion?: number;
  native_tokens_prompt?: number;
  native_tokens_completion?: number;
  num_media_generations?: number | null;
  finish_reason?: string | null;
  provider_name?: string;
  moderation_results?: unknown[];
  usage?: number;
  total_cost?: number;
  latency?: number;
}

/**
 * Fetch generation stats from OpenRouter with retry logic
 */
export async function fetchOpenRouterStats(
  generationId: string,
  maxRetries = 3
): Promise<OpenRouterStats | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!res.ok) {
        logger.warn(`OpenRouter stats fetch failed (attempt ${attempt})`, {
          status: res.status,
          generationId,
        });

        if (attempt < maxRetries) {
          const delayMs = 500 * attempt;
          logger.api("OpenRouter stats not ready yet, retrying...", {
            generationId,
            attempt,
            nextDelayMs: delayMs,
          });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        return null;
      }

      const json = await res.json();
      return json.data as OpenRouterStats;
    } catch (error) {
      logger.error(`OpenRouter stats fetch error (attempt ${attempt})`, {
        generationId,
        error,
      });

      if (attempt < maxRetries) {
        const delayMs = 500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * Create cost metadata from OpenRouter stats
 */
export function createCostMetadata(stats: OpenRouterStats): Record<string, unknown> {
  const cost = stats.usage || stats.total_cost || 0;
  const tokensPrompt = stats.tokens_prompt || stats.native_tokens_prompt || 0;
  const tokensCompletion = stats.tokens_completion || stats.native_tokens_completion || 0;
  const generationTimeMs = stats.generation_time ? stats.generation_time * 1000 : undefined;

  logger.api("/api/documents/summarize:Cost analysis", {
    cost,
    tokens_prompt: tokensPrompt,
    tokens_completion: tokensCompletion,
    generation_time_ms: generationTimeMs,
    model: stats.model,
    provider: stats.provider_name,
  });

  return {
    openrouter_generation_id: stats.id,
    openrouter_cost: cost,
    openrouter_tokens_prompt: tokensPrompt,
    openrouter_tokens_completion: tokensCompletion,
    openrouter_native_tokens_prompt: stats.native_tokens_prompt,
    openrouter_native_tokens_completion: stats.native_tokens_completion,
    openrouter_generation_time_ms: generationTimeMs,
    openrouter_latency_ms: stats.latency,
    openrouter_model: stats.model,
    openrouter_provider: stats.provider_name,
    openrouter_finish_reason: stats.finish_reason,
    openrouter_streamed: stats.streamed,
  };
}
