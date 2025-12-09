/**
 * OMR Service Client
 * HTTP client for communicating with the OMR microservice
 */

import { logger } from "@/lib/utils/logger";

// Type definitions
export interface OMRAnswer {
  number: number;
  value: string | null;
  confidence: number;
  num_options: number;
}

export interface OMRResult {
  success: boolean;
  qr_data?: string | null;
  total_questions?: number;
  answered_questions?: number;
  answers?: OMRAnswer[];
  processed_image?: string | null;
  error?: string;
  error_code?: string;
  details?: Record<string, unknown>;
}

export interface OMRClientOptions {
  /**
   * OMR service URL (e.g., http://localhost:8000)
   * Defaults to environment variable OMR_SERVICE_URL
   */
  serviceUrl?: string;

  /**
   * API key for authentication
   * Defaults to environment variable OMR_SERVICE_API_KEY
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * Defaults to 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure
   * Defaults to 2
   */
  retries?: number;

  /**
   * Enable debug image generation
   * Defaults to false
   */
  debug?: boolean;
}

/**
 * Custom error class for OMR service errors
 */
export class OMRServiceError extends Error {
  public readonly statusCode?: number;
  public readonly errorCode?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode?: number,
    errorCode?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OMRServiceError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * OMR Service Client
 * Handles communication with the OMR processing microservice
 */
export class OMRClient {
  private readonly serviceUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly debug: boolean;

  constructor(options: OMRClientOptions = {}) {
    // Service URL (required)
    this.serviceUrl =
      options.serviceUrl ||
      process.env.OMR_SERVICE_URL ||
      process.env.NEXT_PUBLIC_OMR_SERVICE_URL ||
      "http://localhost:8000";

    // Remove trailing slash
    if (this.serviceUrl.endsWith("/")) {
      this.serviceUrl = this.serviceUrl.slice(0, -1);
    }

    // API Key (optional)
    this.apiKey =
      options.apiKey ||
      process.env.OMR_SERVICE_API_KEY ||
      process.env.NEXT_PUBLIC_OMR_SERVICE_API_KEY;

    // Timeout (default: 30s)
    this.timeout =
      options.timeout ||
      parseInt(process.env.OMR_TIMEOUT_MS || "30000", 10);

    // Retries (default: 2)
    this.retries = options.retries ?? 2;

    // Debug (default: false)
    this.debug = options.debug ?? false;

    logger.log("[OMRClient] Initialized", {
      serviceUrl: this.serviceUrl,
      timeout: this.timeout,
      retries: this.retries,
      debug: this.debug,
      hasApiKey: !!this.apiKey,
    });
  }

  /**
   * Health check endpoint
   * @returns Health status of the OMR service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    uptime_seconds: number;
  }> {
    const url = `${this.serviceUrl}/health`;

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5s timeout for health check
      });

      if (!response.ok) {
        throw new OMRServiceError(
          `Health check failed: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OMRServiceError) {
        throw error;
      }

      throw new OMRServiceError(
        `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        "HEALTH_CHECK_FAILED"
      );
    }
  }

  /**
   * Process an exam image with OMR
   * @param imageFile - Image file to process (File or Blob)
   * @returns OMR processing result
   */
  async processImage(
    imageFile: File | Blob
  ): Promise<OMRResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // Retry loop
    while (attempt <= this.retries) {
      try {
        attempt++;

        logger.log("[OMRClient] Processing image", {
          attempt,
          maxRetries: this.retries,
          fileSize: imageFile.size,
          fileType: imageFile.type,
        });

        // Create FormData
        const formData = new FormData();
        formData.append("file", imageFile);
        if (this.debug) {
          formData.append("debug", "true");
        }

        // Build headers
        const headers: Record<string, string> = {};
        if (this.apiKey) {
          headers["X-API-Key"] = this.apiKey;
        }

        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.serviceUrl}/process`, {
            method: "POST",
            headers,
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Parse response
          const result: OMRResult = await response.json();

          // Check HTTP status
          if (!response.ok) {
            throw new OMRServiceError(
              result.error || `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              result.error_code,
              result.details
            );
          }

          // Check success in result
          if (!result.success) {
            // Don't retry on processing failures (e.g., QR not found)
            logger.warn("[OMRClient] Processing failed (no retry)", {
              error: result.error,
              errorCode: result.error_code,
            });

            return result; // Return error result without throwing
          }

          // Success
          const duration = Date.now() - startTime;
          logger.log("[OMRClient] Processing succeeded", {
            duration,
            attempt,
            totalQuestions: result.total_questions,
            answeredQuestions: result.answered_questions,
          });

          return result;
        } catch (fetchError) {
          clearTimeout(timeoutId);

          // Handle fetch errors
          if (fetchError instanceof OMRServiceError) {
            throw fetchError;
          }

          if (fetchError instanceof Error) {
            if (fetchError.name === "AbortError") {
              throw new OMRServiceError(
                `Request timeout after ${this.timeout}ms`,
                undefined,
                "TIMEOUT"
              );
            }

            throw new OMRServiceError(
              `Network error: ${fetchError.message}`,
              undefined,
              "NETWORK_ERROR"
            );
          }

          throw fetchError;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          error instanceof OMRServiceError &&
          (error.statusCode === 400 || // Bad request
            error.statusCode === 401 || // Unauthorized
            error.errorCode === "PROCESSING_FAILED") // Processing error (not network)
        ) {
          logger.error("[OMRClient] Non-retryable error", {
            error: lastError.message,
            errorCode: error.errorCode,
            statusCode: error.statusCode,
          });
          throw error;
        }

        // Log retry
        if (attempt <= this.retries) {
          logger.warn("[OMRClient] Request failed, retrying", {
            attempt,
            maxRetries: this.retries,
            error: lastError.message,
          });

          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    const duration = Date.now() - startTime;
    logger.error("[OMRClient] All retries exhausted", {
      attempts: attempt,
      duration,
      lastError: lastError?.message,
    });

    throw new OMRServiceError(
      `Failed after ${attempt} attempts: ${lastError?.message || "Unknown error"}`,
      undefined,
      "MAX_RETRIES_EXCEEDED",
      { attempts: attempt, lastError: lastError?.message }
    );
  }
}

/**
 * Default OMR client instance (singleton)
 */
let defaultClient: OMRClient | null = null;

/**
 * Get the default OMR client instance
 * @param options - Optional configuration options
 */
export function getOMRClient(options?: OMRClientOptions): OMRClient {
  if (!defaultClient) {
    defaultClient = new OMRClient(options);
  }
  return defaultClient;
}

/**
 * Process an image using the default OMR client
 * Convenience function for simple use cases
 */
export async function processOMRImage(
  imageFile: File | Blob,
  options?: OMRClientOptions
): Promise<OMRResult> {
  const client = getOMRClient(options);
  return client.processImage(imageFile);
}
