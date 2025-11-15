/**
 * LaTeX Compilation Service Client
 * HTTP client for communicating with the LaTeX microservice
 */

import { logger } from "@/lib/utils/logger";

// Type definitions
export interface LaTeXCompileOptions {
  /**
   * LaTeX source code to compile
   */
  tex: string;

  /**
   * Output filename (without extension)
   * Default: "exam"
   */
  jobName?: string;
}

export interface LaTeXClientOptions {
  /**
   * LaTeX service URL (e.g., https://latex-service.profevision.com)
   * Defaults to environment variable LATEX_SERVICE_URL
   */
  serviceUrl?: string;

  /**
   * API key for authentication
   * Defaults to environment variable LATEX_SERVICE_API_KEY
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * Defaults to 90000ms (90 seconds) - LaTeX compilation can be slow
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure
   * Defaults to 1 (LaTeX compilation is expensive, don't retry too much)
   */
  retries?: number;
}

/**
 * Custom error for LaTeX service errors
 */
export class LaTeXServiceError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;
  log?: string;

  constructor(message: string, code: string, statusCode: number, details?: unknown, log?: string) {
    super(message);
    this.name = "LaTeXServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.log = log;
  }
}

/**
 * LaTeX Compilation Service Client
 */
export class LaTeXClient {
  private serviceUrl: string;
  private apiKey: string | null;
  private timeout: number;
  private retries: number;

  constructor(options: LaTeXClientOptions = {}) {
    this.serviceUrl =
      options.serviceUrl ||
      process.env.LATEX_SERVICE_URL ||
      "http://localhost:8001";

    this.apiKey =
      options.apiKey ||
      process.env.LATEX_SERVICE_API_KEY ||
      null;

    this.timeout =
      options.timeout ||
      parseInt(process.env.LATEX_TIMEOUT_MS || "90000", 10);

    this.retries = options.retries ?? 1;

    logger.log("[LaTeX Client] Initialized", {
      serviceUrl: this.serviceUrl,
      hasApiKey: !!this.apiKey,
      timeout: this.timeout,
      retries: this.retries,
    });
  }

  /**
   * Compile LaTeX source to PDF
   *
   * @param options Compilation options
   * @returns PDF binary data
   * @throws LaTeXServiceError if compilation fails
   */
  async compile(options: LaTeXCompileOptions): Promise<Buffer> {
    const { tex, jobName = "exam" } = options;

    logger.log(`[LaTeX Client] Compiling LaTeX document: ${jobName}`);

    // Validate input
    if (!tex || typeof tex !== "string" || tex.trim().length === 0) {
      throw new LaTeXServiceError(
        "LaTeX source code is required",
        "INVALID_INPUT",
        400
      );
    }

    const payload = {
      tex,
      job_name: jobName,
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.retries + 1; attempt++) {
      try {
        logger.log(`[LaTeX Client] Attempt ${attempt}/${this.retries + 1}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const headers: HeadersInit = {
            "Content-Type": "application/json",
          };

          if (this.apiKey) {
            headers["X-API-Key"] = this.apiKey;
          }

          const response = await fetch(`${this.serviceUrl}/compile`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Success case - PDF returned
          if (response.ok) {
            const pdfBuffer = await response.arrayBuffer();
            const compileTime = response.headers.get("X-Compile-Time-Ms");
            const pdfSize = response.headers.get("X-PDF-Size-Bytes");

            logger.log(
              `[LaTeX Client] Compilation successful: ` +
                `time=${compileTime}ms, size=${pdfSize} bytes`
            );

            return Buffer.from(pdfBuffer);
          }

          // Error case - try to parse error response
          let errorData: {
            error?: string;
            error_code?: string;
            details?: unknown;
            log?: string;
          };

          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text, error_code: "UNKNOWN" };
          }

          const errorMessage = errorData.error || "LaTeX compilation failed";
          const errorCode = errorData.error_code || "COMPILATION_ERROR";

          throw new LaTeXServiceError(
            errorMessage,
            errorCode,
            response.status,
            errorData.details,
            errorData.log
          );
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof LaTeXServiceError) {
            throw error;
          }

          // Network or abort errors
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              throw new LaTeXServiceError(
                `LaTeX compilation timeout after ${this.timeout}ms`,
                "TIMEOUT",
                408
              );
            }

            throw new LaTeXServiceError(
              `Network error: ${error.message}`,
              "NETWORK_ERROR",
              500
            );
          }

          throw new LaTeXServiceError(
            "Unknown error during LaTeX compilation",
            "UNKNOWN_ERROR",
            500
          );
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except timeout
        if (
          error instanceof LaTeXServiceError &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.code !== "TIMEOUT"
        ) {
          logger.error(
            `[LaTeX Client] Client error (${error.statusCode}), not retrying:`,
            error.message
          );
          throw error;
        }

        // Retry on server errors (5xx) and timeout
        if (attempt < this.retries + 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.warn(
            `[LaTeX Client] Attempt ${attempt} failed, retrying in ${backoffMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // All retries exhausted
        logger.error(
          `[LaTeX Client] All ${this.retries + 1} attempts failed`
        );
        throw error;
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new LaTeXServiceError(
      "LaTeX compilation failed after retries",
      "MAX_RETRIES_EXCEEDED",
      500
    );
  }

  /**
   * Check if LaTeX service is healthy
   *
   * @returns true if service is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.serviceUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === "healthy";
    } catch (error) {
      logger.error("[LaTeX Client] Health check failed:", error);
      return false;
    }
  }
}

/**
 * Singleton instance for convenience
 */
let defaultClient: LaTeXClient | null = null;

/**
 * Get or create default LaTeX client instance
 */
export function getLatexClient(options?: LaTeXClientOptions): LaTeXClient {
  if (!defaultClient) {
    defaultClient = new LaTeXClient(options);
  }
  return defaultClient;
}

/**
 * Compile LaTeX source to PDF using default client
 * Convenience function for one-off compilations
 *
 * @param tex LaTeX source code
 * @param jobName Output filename (default: "exam")
 * @returns PDF binary data
 */
export async function compileLatex(
  tex: string,
  jobName: string = "exam"
): Promise<Buffer> {
  const client = getLatexClient();
  return await client.compile({ tex, jobName });
}
