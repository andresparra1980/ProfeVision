/**
 * LangSmith Tracing for Mastra Chat
 *
 * Provides observability for the Mastra-based exam generation workflow.
 * Tracks agent execution, tool calls, auto-processing, and recovery.
 */

import { Client } from "langsmith";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/utils/logger";
import { trackAsync, trackSync, getProjectName } from "@/lib/ai/langsmith-client";

/**
 * Initialize LangSmith client
 */
export function initializeLangSmithClient(): Client | null {
  // Check if tracing is enabled
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
 * Create root run for Mastra chat session
 */
export async function createMastraRootRun(
  client: Client,
  metadata: {
    userId: string;
    uiLocale: string;
    generationLocale: string;
    messageCount: number;
    hasDocumentContext: boolean;
    hasExamContext: boolean;
  }
): Promise<string | null> {
  // CRITICAL: Synchronous - needed for run ID
  const runId = uuidv4();

  logger.api("Creating LangSmith root run", {
    runId,
    userId: metadata.userId,
    uiLocale: metadata.uiLocale,
    generationLocale: metadata.generationLocale,
    project: getProjectName(),
    endpoint: process.env.LANGSMITH_ENDPOINT,
  });

  try {
    await trackSync(
      () => client.createRun({
        id: runId,
        name: "mastra_chat_exam_generation",
        run_type: "chain",
        start_time: Date.now(),
        inputs: {
          endpoint: "/api/chat-mastra",
          uiLocale: metadata.uiLocale,
          generationLocale: metadata.generationLocale,
          messageCount: metadata.messageCount,
        },
        extra: {
          metadata: {
            userId: metadata.userId,
            uiLocale: metadata.uiLocale,
            generationLocale: metadata.generationLocale,
            localesMatch: metadata.uiLocale === metadata.generationLocale,
            hasDocumentContext: metadata.hasDocumentContext,
            hasExamContext: metadata.hasExamContext,
            timestamp: new Date().toISOString(),
          },
        },
        project_name: getProjectName(),
      }),
      "createMastraRootRun"
    );

    // If we reach here, creation succeeded
    logger.api("LangSmith root run created", {
      runId,
      userId: metadata.userId,
      uiLocale: metadata.uiLocale,
      generationLocale: metadata.generationLocale,
    });
    return runId;
  } catch (error) {
    logger.error("Failed to create LangSmith root run", {
      error,
      userId: metadata.userId,
    });
    return null;
  }
}

/**
 * Track agent step execution (returns the step run ID for child LLM calls)
 * NON-CRITICAL: Fire-and-forget to avoid blocking
 */
export function trackAgentStep(
  client: Client,
  parentRunId: string,
  stepData: {
    stepNumber: number;
    toolName?: string;
    text?: string;
    duration?: number;
    userId: string;
  }
): string {
  // Generate ID immediately for potential child runs
  const stepRunId = uuidv4();

  // Fire-and-forget: Don't block on network call
  trackAsync(
    () => client.createRun({
      id: stepRunId,
      name: `agent_step_${stepData.stepNumber}`,
      run_type: "chain",
      start_time: Date.now(),
      end_time: new Date().toISOString(),
      inputs: {
        stepNumber: stepData.stepNumber,
        toolName: stepData.toolName || "none",
      },
      outputs: {
        text: stepData.text?.substring(0, 500) || "",
      },
      parent_run_id: parentRunId,
      extra: {
        metadata: {
          userId: stepData.userId,
          toolName: stepData.toolName,
          duration: stepData.duration,
        },
      },
      project_name: getProjectName(),
    }),
    `trackAgentStep (step ${stepData.stepNumber})`
  );

  logger.api("LangSmith agent step queued", {
    stepRunId,
    parentRunId,
    stepNumber: stepData.stepNumber,
    toolName: stepData.toolName
  });

  return stepRunId;
}

/**
 * Track LLM call (OpenRouter)
 * NON-CRITICAL: Fire-and-forget to avoid blocking
 */
export function trackLLMCall(
  client: Client,
  parentRunId: string,
  llmData: {
    model: string;
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    response?: string;
    toolCalls?: Array<{ name: string; args: unknown }>;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    duration?: number;
    userId: string;
  }
): void {
  const llmRunId = uuidv4();

  trackAsync(
    () => client.createRun({
      id: llmRunId,
      name: llmData.model || "openrouter/model",
      run_type: "llm",
      start_time: Date.now(),
      end_time: new Date().toISOString(),
      inputs: {
        messages: llmData.messages || [{ role: "user", content: llmData.prompt || "" }],
        model: llmData.model,
      },
      outputs: {
        response: llmData.response || "",
        toolCalls: llmData.toolCalls || [],
      },
      parent_run_id: parentRunId,
      extra: {
        metadata: {
          userId: llmData.userId,
          promptTokens: llmData.promptTokens || 0,
          completionTokens: llmData.completionTokens || 0,
          totalTokens: llmData.totalTokens || 0,
          duration: llmData.duration,
          model: llmData.model,
        },
      },
      project_name: getProjectName(),
    }),
    `trackLLMCall (${llmData.model})`
  );

  logger.api("LangSmith LLM call queued", {
    llmRunId,
    parentRunId,
    model: llmData.model,
    hasToolCalls: (llmData.toolCalls?.length || 0) > 0,
  });
}

/**
 * Track tool execution
 * NON-CRITICAL: Fire-and-forget to avoid blocking
 */
export function trackToolExecution(
  client: Client,
  parentRunId: string,
  toolData: {
    toolName: string;
    inputs: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    duration?: number;
    success: boolean;
    error?: string;
    userId: string;
  }
): void {
  const toolRunId = uuidv4();

  const runData: {
    id: string;
    name: string;
    run_type: "tool";
    start_time: number;
    inputs: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    parent_run_id: string;
    extra: {
      metadata: Record<string, unknown>;
    };
    project_name: string;
    end_time?: string;
    error?: string;
  } = {
    id: toolRunId,
    name: toolData.toolName,
    run_type: "tool",
    start_time: Date.now(),
    inputs: toolData.inputs,
    parent_run_id: parentRunId,
    extra: {
      metadata: {
        userId: toolData.userId,
        duration: toolData.duration,
        success: toolData.success,
      },
    },
    project_name: getProjectName(),
  };

  if (toolData.outputs) {
    runData.outputs = toolData.outputs;
  }

  if (!toolData.success && toolData.error) {
    runData.error = toolData.error;
    runData.end_time = new Date().toISOString();
  }

  trackAsync(
    () => client.createRun(runData),
    `trackToolExecution (${toolData.toolName})`
  );

  logger.api("LangSmith tool queued", {
    toolName: toolData.toolName,
    success: toolData.success,
    userId: toolData.userId,
  });
}

/**
 * Track auto-processing (validate + randomize)
 * NON-CRITICAL: Fire-and-forget to avoid blocking
 */
export function trackAutoProcessing(
  client: Client,
  parentRunId: string,
  processingData: {
    questionCount: number;
    validQuestions: number;
    questionsRandomized: number;
    correctionsApplied: number;
    duration: number;
    userId: string;
  }
): void {
  const processingRunId = uuidv4();

  trackAsync(
    () => client.createRun({
      id: processingRunId,
      name: "auto_processing_validate_randomize",
      run_type: "chain",
      start_time: Date.now(),
      end_time: new Date().toISOString(),
      inputs: {
        questionCount: processingData.questionCount,
      },
      outputs: {
        validQuestions: processingData.validQuestions,
        questionsRandomized: processingData.questionsRandomized,
        correctionsApplied: processingData.correctionsApplied,
      },
      parent_run_id: parentRunId,
      extra: {
        metadata: {
          userId: processingData.userId,
          duration: processingData.duration,
          successRate: (processingData.validQuestions / processingData.questionCount) * 100,
        },
      },
      project_name: getProjectName(),
    }),
    "trackAutoProcessing"
  );

  logger.api("LangSmith auto-processing queued", {
    validQuestions: processingData.validQuestions,
    userId: processingData.userId,
  });
}

/**
 * Track recovery from error
 * NON-CRITICAL: Fire-and-forget to avoid blocking
 */
export function trackRecovery(
  client: Client,
  parentRunId: string,
  recoveryData: {
    originalError: string;
    recoveredQuestions: number;
    stepCount: number;
    success: boolean;
    userId: string;
  }
): void {
  const recoveryRunId = uuidv4();

  trackAsync(
    () => client.createRun({
      id: recoveryRunId,
      name: "error_recovery",
      run_type: "chain",
      start_time: Date.now(),
      end_time: new Date().toISOString(),
      inputs: {
        originalError: recoveryData.originalError.substring(0, 500),
        stepCount: recoveryData.stepCount,
      },
      outputs: {
        success: recoveryData.success,
        recoveredQuestions: recoveryData.recoveredQuestions,
      },
      parent_run_id: parentRunId,
      extra: {
        metadata: {
          userId: recoveryData.userId,
          recoveryAttempted: true,
          recoverySuccess: recoveryData.success,
        },
      },
      project_name: getProjectName(),
    }),
    "trackRecovery"
  );

  logger.api("LangSmith recovery queued", {
    success: recoveryData.success,
    recoveredQuestions: recoveryData.recoveredQuestions,
    userId: recoveryData.userId,
  });
}

/**
 * Finalize root run with complete metadata
 * CRITICAL: Synchronous to ensure trace completion
 */
export async function finalizeMastraRun(
  client: Client,
  runId: string,
  finalData: {
    success: boolean;
    questionCount: number;
    stepsExecuted: number;
    toolsUsed: string[];
    totalDuration: number;
    error?: string;
    recovered?: boolean;
    userId: string;
  }
): Promise<void> {
  const updatePayload: {
    outputs: Record<string, unknown>;
    extra: {
      metadata: Record<string, unknown>;
    };
    end_time: string;
    error?: string;
  } = {
    outputs: {
      success: finalData.success,
      questionCount: finalData.questionCount,
      stepsExecuted: finalData.stepsExecuted,
    },
    extra: {
      metadata: {
        userId: finalData.userId,
        toolsUsed: finalData.toolsUsed,
        totalDuration: finalData.totalDuration,
        recovered: finalData.recovered || false,
        timestamp: new Date().toISOString(),
      },
    },
    end_time: new Date().toISOString(),
  };

  if (!finalData.success && finalData.error) {
    updatePayload.error = finalData.error;
  }

  try {
    await trackSync(
      () => client.updateRun(runId, updatePayload),
      "finalizeMastraRun",
      { throwOnError: true }
    );

    logger.api("LangSmith run finalized", {
      runId,
      success: finalData.success,
      questionCount: finalData.questionCount,
      userId: finalData.userId,
    });
  } catch (error) {
    logger.error("Failed to finalize LangSmith run - run may remain open", {
      runId,
      userId: finalData.userId,
      error: String(error),
    });
  }
}
