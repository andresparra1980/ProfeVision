/**
 * useSSEStream Hook
 *
 * Handles Server-Sent Events (SSE) streaming for real-time AI progress updates.
 * Used with the /api/chat-mastra endpoint for Mastra-based exam generation.
 *
 * Features:
 * - Fetch-based SSE handling (POST support)
 * - Message parsing and state management
 * - Error handling and cleanup
 * - i18n message key support
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 2.1
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "@/lib/utils/logger";

/**
 * SSE Message structure from backend
 */
export interface SSEMessage {
  type: "progress" | "done" | "error";
  messageKey?: string; // i18n key (e.g., "chat.progress.step")
  text?: string;
  toolCalls?: Array<{
    name: string;
    args?: unknown;
  }>;
  result?: unknown;
  error?: string;
  finishReason?: string;
  steps?: number;
  params?: Record<string, unknown>; // i18n params
}

export interface UseSSEStreamReturn {
  /** Whether the stream is currently active */
  isStreaming: boolean;

  /** Array of received SSE messages */
  messages: SSEMessage[];

  /** Start streaming from an endpoint */
  startStream: (_endpoint: string, _payload: unknown, _authToken?: string) => Promise<void>;

  /** Stop the current stream */
  stopStream: () => void;

  /** Clear all messages */
  clearMessages: () => void;
}

/**
 * Hook for managing SSE streaming connections
 *
 * @example
 * ```tsx
 * const { isStreaming, messages, startStream } = useSSEStream();
 *
 * const handleGenerate = async () => {
 *   await startStream('/api/chat-mastra', {
 *     messages: [{ role: 'user', content: 'Generate 10 questions' }],
 *     context: { language: 'es', numQuestions: 10 }
 *   });
 * };
 * ```
 */
export function useSSEStream(): UseSSEStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start SSE stream
   */
  const startStream = useCallback(
    async (endpoint: string, payload: unknown, authToken?: string) => {
      // Cleanup previous stream if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this stream
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsStreaming(true);
      setMessages([]);

      try {
        // Build headers
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        // Start fetch with streaming
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        // Check for body
        if (!response.body) {
          throw new Error("Response body is null");
        }

        // Read stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            logger.log("[useSSEStream] Stream completed");
            break;
          }

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");

          // Keep incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const dataStr = line.slice(6); // Remove "data: " prefix
                if (dataStr.trim()) {
                  const data: SSEMessage = JSON.parse(dataStr);

                  logger.log("[useSSEStream] Received message", {
                    type: data.type,
                    messageKey: data.messageKey
                  });

                  // Debug done messages
                  if (data.type === "done" && data.result) {
                    logger.log("[useSSEStream] Done message result", {
                      resultType: typeof data.result,
                      resultLength: typeof data.result === "string" ? data.result.length : "N/A",
                      resultPreview: typeof data.result === "string" ? data.result.substring(0, 200) : data.result,
                      finishReason: data.finishReason,
                    });
                  }

                  // Add message to state
                  setMessages((prev) => [...prev, data]);

                  // Stop streaming on done/error
                  if (data.type === "done" || data.type === "error") {
                    setIsStreaming(false);
                    logger.log("[useSSEStream] Stream finished", { type: data.type });
                  }
                }
              } catch (error) {
                logger.error("[useSSEStream] Failed to parse message", { line, error });
              }
            }
          }
        }

        setIsStreaming(false);
      } catch (error) {
        // Ignore AbortError - it's expected when stream is intentionally stopped
        if (error instanceof Error && error.name === "AbortError") {
          logger.log("[useSSEStream] Stream aborted (intentional)");
          setIsStreaming(false);
          return;
        }

        logger.error("[useSSEStream] Stream error", { error });

        // Add error message
        const errorMessage: SSEMessage = {
          type: "error",
          messageKey: "chat.error.connection",
          error: error instanceof Error ? error.message : "Unknown error",
        };

        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
      }
    },
    []
  );

  /**
   * Stop current stream
   */
  const stopStream = useCallback(() => {
    logger.log("[useSSEStream] Stopping stream");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isStreaming,
    messages,
    startStream,
    stopStream,
    clearMessages,
  };
}
