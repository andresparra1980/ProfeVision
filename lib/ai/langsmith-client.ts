/**
 * Optimized LangSmith Client Wrapper
 *
 * Performance optimization: Uses fire-and-forget for non-critical tracking
 * to avoid blocking the critical path with network latency.
 *
 * Critical events (synchronous):
 * - Root run creation (needed for run ID)
 * - Root run finalization (ensures trace completion)
 *
 * Non-critical events (fire-and-forget):
 * - Agent steps
 * - Tool executions
 * - LLM calls
 * - Auto-processing
 * - Recovery tracking
 *
 * Related: Issue #37
 */

import { Client } from "langsmith";
import logger from "@/lib/utils/logger";

/**
 * Fire-and-forget wrapper for non-critical LangSmith tracking
 * Executes async without blocking, logs errors without throwing
 */
export function trackAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): void {
  operation().catch((error) => {
    logger.warn(`LangSmith ${operationName} failed (non-blocking)`, {
      error: String(error),
      operationName,
    });
  });
}

/**
 * Synchronous wrapper for critical operations with retry logic
 * Retries failed operations to ensure trace completion
 */
export async function trackSync<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T,
  options: { retries?: number; retryDelay?: number } = {}
): Promise<T | null> {
  const { retries = 2, retryDelay = 100 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await operation();

      // Log successful retry
      if (attempt > 0) {
        logger.api(`LangSmith ${operationName} succeeded on retry ${attempt}`, {
          operationName,
          attempt,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Log retry attempt
      if (attempt < retries) {
        logger.warn(`LangSmith ${operationName} failed, retrying (${attempt + 1}/${retries})`, {
          error: String(error),
          operationName,
          attempt: attempt + 1,
          maxRetries: retries,
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All retries exhausted
  logger.error(`LangSmith ${operationName} failed after ${retries + 1} attempts (critical)`, {
    error: String(lastError),
    operationName,
    attempts: retries + 1,
  });

  return fallbackValue !== undefined ? fallbackValue : null;
}

/**
 * Initialize LangSmith client
 */
export function initializeLangSmithClient(): Client | null {
  if (process.env.LANGSMITH_TRACING !== "true") {
    logger.warn("LangSmith tracing disabled: LANGSMITH_TRACING not set to 'true'");
    return null;
  }

  if (!process.env.LANGSMITH_API_KEY) {
    logger.warn("LangSmith tracing disabled: LANGSMITH_API_KEY not set");
    return null;
  }

  try {
    return new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
    });
  } catch (error) {
    logger.error("Failed to initialize LangSmith client", { error });
    return null;
  }
}

/**
 * Get project name from environment or default
 */
export function getProjectName(): string {
  return process.env.LANGSMITH_PROJECT || "ProfeVision-dev";
}
