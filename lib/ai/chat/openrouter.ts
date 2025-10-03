import logger from "@/lib/utils/logger";
import { OpenRouterStats } from "./schemas";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Fetches OpenRouter generation stats with retry logic
 * OpenRouter stats may take a moment to be available, so we retry with delays
 */
export async function fetchOpenRouterStats(
  generationId: string
): Promise<Record<string, unknown> | null> {
  const maxRetries = 3;
  const delays = [500, 1000, 2000]; // ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before retry (except first attempt)
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, delays[attempt - 1])
        );
      }

      const response = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data?.data || null;
      }

      // If 404, the stats might not be ready yet, retry
      if (response.status === 404 && attempt < maxRetries - 1) {
        logger.api("OpenRouter stats not ready yet, retrying...", {
          generationId,
          attempt: attempt + 1,
          nextDelayMs: delays[attempt],
        });
        continue;
      }

      // Other errors or last attempt
      logger.warn("Failed to fetch OpenRouter stats", {
        generationId,
        status: response.status,
        attempt: attempt + 1,
      });
      return null;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        logger.warn("Error fetching OpenRouter stats", {
          generationId,
          error: String(error),
          attempts: maxRetries,
        });
      }
    }
  }

  return null;
}

/**
 * Creates cost metadata object from OpenRouter stats
 */
export function createCostMetadata(
  stats: OpenRouterStats,
  traceMetadata: Record<string, string | number | boolean | undefined>,
  generationId: string
): Record<string, string | number | boolean | undefined> {
  return {
    ...traceMetadata,
    openrouter_generation_id: generationId as string,
    openrouter_cost: (stats.usage || stats.total_cost) as number,
    openrouter_tokens_prompt: stats.tokens_prompt as number,
    openrouter_tokens_completion: stats.tokens_completion as number,
    openrouter_native_tokens_prompt: stats.native_tokens_prompt as number,
    openrouter_native_tokens_completion:
      stats.native_tokens_completion as number,
    openrouter_generation_time_ms: stats.generation_time as number,
    openrouter_latency_ms: stats.latency as number,
    openrouter_model: stats.model as string,
    openrouter_provider: stats.provider_name as string,
    openrouter_finish_reason: stats.finish_reason as string,
    openrouter_streamed: stats.streamed as boolean,
  };
}
