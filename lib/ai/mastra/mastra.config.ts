/**
 * Mastra Configuration
 *
 * Central configuration for the Mastra instance with registered agents.
 *
 * This file creates and exports the main Mastra instance that orchestrates
 * all AI agents and tools for exam generation.
 *
 * @see mddocs/ai_chat_mastra/PLAN_ALTO_NIVEL.md
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.11
 */

import { Mastra } from "@mastra/core";
import { chatOrchestratorAgent } from "./agents/chat-orchestrator";

/**
 * Main Mastra Instance
 *
 * Centralized instance that manages all AI agents.
 * Currently registers:
 * - chatOrchestrator: Main agent for exam generation workflow
 *
 * Usage:
 * ```typescript
 * import { mastra } from "@/lib/ai/mastra";
 *
 * const agent = mastra.getAgent('chatOrchestrator');
 * const result = await agent.generate({
 *   messages: [{ role: 'user', content: 'Generate exam...' }],
 *   maxSteps: 10,
 * });
 * ```
 */
export const mastra = new Mastra({
  agents: {
    chatOrchestrator: chatOrchestratorAgent,
  },
});
