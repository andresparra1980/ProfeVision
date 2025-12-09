import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Client } from "langsmith";
import logger from "@/lib/utils/logger";
import { trackSync } from "@/lib/ai/langsmith-client";

/**
 * Callback handler to capture the root run ID from LangChain pipeline
 */
export class RootRunCapture extends BaseCallbackHandler {
  name = "root-run-capture";
  rootRunId: string | undefined;

  // New hook name
  async onChainStart(
    _serialized: unknown,
    _inputs: unknown,
    runId: string,
    _parentRunId?: string
  ) {
    if (!this.rootRunId && !_parentRunId) this.rootRunId = runId;
  }

  // Back-compat hook name
  async handleChainStart(
    _llm: unknown,
    _prompts: unknown,
    runId: string,
    _parentRunId?: string
  ) {
    if (!this.rootRunId && !_parentRunId) this.rootRunId = runId;
  }
}

/**
 * Initializes LangSmith tracing and returns client, tracer, and rootRunId
 * CRITICAL: Synchronous - needed for run ID
 */
export async function initializeLangSmithTracing(): Promise<{
  client: Client | null;
  tracer: unknown | null;
  rootRunId: string | null;
}> {
  const client = process.env.LANGCHAIN_API_KEY ? new Client() : null;
  let tracer: unknown | null = null;
  let rootRunId: string | null = null;

  if (client) {
    try {
      const run = await trackSync(
        () => client.createRun({
          name: "chat_exam_generation",
          run_type: "chain",
          inputs: { endpoint: "/api/chat" },
          project_name: process.env.LANGCHAIN_PROJECT || undefined,
        }),
        "initializeLangSmithTracing"
      );

      // Some SDKs return { id }, others the full run; handle both
      // @ts-expect-error tolerate unknown shape
      rootRunId = run?.id ?? null;

      if (rootRunId) {
        // Get a tracer so child nodes attach to this project
        try {
          // @ts-expect-error tolerate SDK shape
          tracer = await client.getTracer({
            projectName: process.env.LANGCHAIN_PROJECT || undefined,
          });
        } catch (e) {
          logger.warn("Could not get LangSmith tracer", { error: String(e) });
        }
      }
    } catch (error) {
      logger.error("Failed to initialize LangSmith tracing", { error: String(error) });
    }
  }

  return { client, tracer, rootRunId };
}

/**
 * Finalizes a LangSmith run with metadata and outputs
 * CRITICAL: Synchronous to ensure trace completion
 */
export async function finalizeLangSmithRun(
  client: Client,
  runId: string,
  metadata: Record<string, string | number | boolean | undefined>,
  outputs?: Record<string, unknown>
): Promise<void> {
  const updatePayload = {
    outputs: outputs || {},
    extra: { metadata },
    end_time: new Date().toISOString(),
    error: undefined,
    metadata,
  } as Record<string, unknown>;

  try {
    await trackSync(
      () => client.updateRun(runId, updatePayload),
      "finalizeLangSmithRun",
      { throwOnError: true }
    );
  } catch (error) {
    logger.error("Failed to finalize LangSmith run - run may remain open", {
      runId,
      error: String(error),
    });
  }
}

/**
 * Ends a LangSmith run with error information
 * CRITICAL: Synchronous to ensure trace completion
 */
export async function endLangSmithRunWithError(
  client: Client,
  runId: string,
  error: unknown
): Promise<void> {
  try {
    await trackSync(
      () => client.updateRun(runId, {
        end_time: new Date().toISOString(),
        error: String(error),
      }),
      "endLangSmithRunWithError",
      { throwOnError: true }
    );
  } catch (updateError) {
    logger.error("Failed to end LangSmith run with error - run may remain open", {
      runId,
      originalError: String(error),
      updateError: String(updateError),
    });
  }
}
