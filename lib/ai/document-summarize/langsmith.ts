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
    const run = await trackSync(
      () => client.createRun({
        name: "document_topic_summarization",
        run_type: "chain",
        inputs: { endpoint: "/api/documents/summarize" },
        project_name: process.env.LANGCHAIN_PROJECT || undefined,
      }),
      "initializeLangSmithTracing"
    );

    // @ts-expect-error tolerate unknown shape
    rootRunId = run?.id ?? null;

    if (rootRunId) {
      try {
        // @ts-expect-error tolerate SDK shape
        tracer = await client.getTracer({
          projectName: process.env.LANGCHAIN_PROJECT || undefined,
        });
      } catch (e) {
        logger.warn("Could not get LangSmith tracer", { error: String(e) });
      }
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

  await trackSync(
    () => client.updateRun(runId, updatePayload),
    "finalizeLangSmithRun"
  );
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
  await trackSync(
    () => client.updateRun(runId, {
      end_time: new Date().toISOString(),
      error: String(error),
    }),
    "endLangSmithRunWithError"
  );
}
