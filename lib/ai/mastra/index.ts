/**
 * Mastra Module - Main Entry Point
 *
 * Central export point for all Mastra-related functionality.
 *
 * This module exports:
 * - mastra: Main Mastra instance with registered agents
 * - chatOrchestratorAgent: The orchestrator agent
 * - All tools (plan, generate, validate, randomize, regenerate, add)
 * - All schemas (ExamQuestion, ExamPlan, QuestionSpec, enums)
 * - All utilities (chunking, Fisher-Yates shuffle)
 *
 * @see mddocs/ai_chat_mastra/PLAN_ALTO_NIVEL.md
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md
 */

// Core Mastra instance
export { mastra } from "./mastra.config";

// Agents
export { chatOrchestratorAgent } from "./agents/chat-orchestrator";

// Tools
export * from "./tools";

// Schemas
export * from "./schemas";

// Utilities
export * from "./utils";
