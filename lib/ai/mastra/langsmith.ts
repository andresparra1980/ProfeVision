/**
 * LangSmith Tracing for Mastra Chat
 *
 * Provides observability for the Mastra-based exam generation workflow.
 * Tracks agent execution, tool calls, auto-processing, and recovery.
 */

import { Client } from "langsmith";
import { v4 as uuidv4 } from "uuid";
import logger from "@/lib/utils/logger";

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
    locale: string;
    messageCount: number;
    hasDocumentContext: boolean;
    hasExamContext: boolean;
  }
): Promise<string | null> {
  try {
    // Generate a UUID for this run
    const runId = uuidv4();

    logger.api("Creating LangSmith root run", {
      runId,
      userId: metadata.userId,
      project: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
      endpoint: process.env.LANGSMITH_ENDPOINT,
    });

    await client.createRun({
      id: runId,  // Provide the ID we generated
      name: "mastra_chat_exam_generation",
      run_type: "chain",
      start_time: Date.now(),  // Add start time for accurate timing
      inputs: {
        endpoint: "/api/chat-mastra",
        locale: metadata.locale,
        messageCount: metadata.messageCount,
      },
      extra: {
        metadata: {
          userId: metadata.userId,
          hasDocumentContext: metadata.hasDocumentContext,
          hasExamContext: metadata.hasExamContext,
          timestamp: new Date().toISOString(),
        },
      },
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    });

    logger.api("LangSmith root run created", { runId, userId: metadata.userId });
    return runId;
  } catch (error) {
    logger.error("Failed to create LangSmith root run", { error, userId: metadata.userId });
    return null;
  }
}

/**
 * Track agent step execution (returns the step run ID for child LLM calls)
 */
export async function trackAgentStep(
  client: Client,
  parentRunId: string,
  stepData: {
    stepNumber: number;
    toolName?: string;
    text?: string;
    duration?: number;
    userId: string;
  }
): Promise<string | null> {
  try {
    const stepRunId = uuidv4();

    await client.createRun({
      id: stepRunId,  // Provide the ID we generated
      name: `agent_step_${stepData.stepNumber}`,
      run_type: "chain",
      start_time: Date.now(),  // Add start time for accurate timing
      end_time: new Date().toISOString(),  // Mark as completed
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
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    });

    logger.api("LangSmith agent step tracked", {
      stepRunId,
      parentRunId,
      stepNumber: stepData.stepNumber,
      toolName: stepData.toolName
    });

    return stepRunId;
  } catch (error) {
    logger.warn("Failed to track agent step", { error, stepNumber: stepData.stepNumber });
    return null;
  }
}

/**
 * Track LLM call (OpenRouter)
 */
export async function trackLLMCall(
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
): Promise<void> {
  try {
    const llmRunId = uuidv4();

    await client.createRun({
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
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    });

    logger.api("LangSmith LLM call tracked", {
      llmRunId,
      parentRunId,
      model: llmData.model,
      hasToolCalls: (llmData.toolCalls?.length || 0) > 0,
    });
  } catch (error) {
    logger.warn("Failed to track LLM call", { error, model: llmData.model });
  }
}

/**
 * Track tool execution
 */
export async function trackToolExecution(
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
): Promise<void> {
  try {
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
      id: toolRunId,  // Provide the ID we generated
      name: toolData.toolName,
      run_type: "tool",
      start_time: Date.now(),  // Add start time for accurate timing
      inputs: toolData.inputs,
      parent_run_id: parentRunId,
      extra: {
        metadata: {
          userId: toolData.userId,
          duration: toolData.duration,
          success: toolData.success,
        },
      },
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    };

    if (toolData.outputs) {
      runData.outputs = toolData.outputs;
    }

    if (!toolData.success && toolData.error) {
      runData.error = toolData.error;
      runData.end_time = new Date().toISOString();
    }

    await client.createRun(runData);

    logger.api("LangSmith tool tracked", {
      toolName: toolData.toolName,
      success: toolData.success,
      userId: toolData.userId,
    });
  } catch (error) {
    logger.warn("Failed to track tool execution", { error, toolName: toolData.toolName });
  }
}

/**
 * Track auto-processing (validate + randomize)
 */
export async function trackAutoProcessing(
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
): Promise<void> {
  try {
    const processingRunId = uuidv4();

    await client.createRun({
      id: processingRunId,  // Provide the ID we generated
      name: "auto_processing_validate_randomize",
      run_type: "chain",
      start_time: Date.now(),  // Add start time for accurate timing
      end_time: new Date().toISOString(),  // Mark as completed
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
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    });

    logger.api("LangSmith auto-processing tracked", {
      validQuestions: processingData.validQuestions,
      userId: processingData.userId,
    });
  } catch (error) {
    logger.warn("Failed to track auto-processing", { error });
  }
}

/**
 * Track recovery from error
 */
export async function trackRecovery(
  client: Client,
  parentRunId: string,
  recoveryData: {
    originalError: string;
    recoveredQuestions: number;
    stepCount: number;
    success: boolean;
    userId: string;
  }
): Promise<void> {
  try {
    const recoveryRunId = uuidv4();

    await client.createRun({
      id: recoveryRunId,  // Provide the ID we generated
      name: "error_recovery",
      run_type: "chain",
      start_time: Date.now(),  // Add start time for accurate timing
      end_time: new Date().toISOString(),  // Mark as completed
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
      project_name: process.env.LANGSMITH_PROJECT || "ProfeVision-dev",
    });

    logger.api("LangSmith recovery tracked", {
      success: recoveryData.success,
      recoveredQuestions: recoveryData.recoveredQuestions,
      userId: recoveryData.userId,
    });
  } catch (error) {
    logger.warn("Failed to track recovery", { error });
  }
}

/**
 * Finalize root run with complete metadata
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
  try {
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

    await client.updateRun(runId, updatePayload);

    logger.api("LangSmith run finalized", {
      runId,
      success: finalData.success,
      questionCount: finalData.questionCount,
      userId: finalData.userId,
    });
  } catch (error) {
    logger.warn("Failed to finalize LangSmith run", { error, runId });
  }
}
