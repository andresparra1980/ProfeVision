import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Client } from "langsmith";
import logger from "@/lib/utils/logger";

/**
 * Callback handler to capture the root run ID from LangChain pipeline
 */
export class RootRunCapture extends BaseCallbackHandler {
  name = "root-run-capture";
  rootRunId: string | undefined;

  async onChainStart(
    _serialized: unknown,
    _inputs: unknown,
    runId: string,
    _parentRunId?: string
  ) {
    if (!this.rootRunId && !_parentRunId) this.rootRunId = runId;
  }

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
 * Initializes LangSmith tracing for document summarization
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
      const run = await client.createRun({
        name: "document_topic_summarization",
        run_type: "chain",
        inputs: { endpoint: "/api/documents/summarize" },
        project_name: process.env.LANGCHAIN_PROJECT || undefined,
      });
      // @ts-expect-error tolerate unknown shape
      rootRunId = run?.id ?? null;

      try {
        // @ts-expect-error tolerate SDK shape
        tracer = await client.getTracer({
          projectName: process.env.LANGCHAIN_PROJECT || undefined,
        });
      } catch (e) {
        logger.warn("Could not get LangSmith tracer", { error: String(e) });
      }
    } catch (e) {
      logger.warn("Could not create LangSmith root run", { error: String(e) });
    }
  }

  return { client, tracer, rootRunId };
}

/**
 * Finalizes a LangSmith run with metadata and outputs
 */
export async function finalizeLangSmithRun(
  client: Client,
  runId: string,
  metadata: Record<string, string | number | boolean | undefined>,
  outputs?: Record<string, unknown>
): Promise<void> {
  try {
    const updatePayload = {
      outputs: outputs || {},
      extra: { metadata },
      end_time: new Date().toISOString(),
      error: undefined,
      metadata,
    } as Record<string, unknown>;
    await client.updateRun(runId, updatePayload);
  } catch (e) {
    logger.warn("Failed to finalize LangSmith run", {
      runId,
      error: String(e),
    });
  }
}

/**
 * Ends a LangSmith run with error information
 */
export async function endLangSmithRunWithError(
  client: Client,
  runId: string,
  error: unknown
): Promise<void> {
  try {
    await client.updateRun(runId, {
      end_time: new Date().toISOString(),
      error: String(error),
    });
  } catch (e) {
    logger.warn("Failed to end LangSmith run on error", {
      runId,
      error: String(e),
    });
  }
}
