/**
 * Regenerate Question Tool
 *
 * Regenerates a specific question while maintaining its ID and context.
 * Used for iterative refinement of exam questions.
 *
 * This tool allows users to request changes to individual questions
 * without regenerating the entire exam.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.7
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  ExamQuestionSchema,
  QuestionTypeEnum,
  DifficultyEnum,
  TaxonomyLevelEnum,
  TopicSummarySchema,
  type ExamQuestion,
} from "../schemas";
import { logger } from "@/lib/utils/logger";

/**
 * Question override parameters
 */
interface QuestionOverrides {
  type?: string;
  difficulty?: string;
  taxonomyLevel?: string;
  topic?: string;
}

/**
 * Input schema for regenerate question tool
 */
const inputSchema = z.object({
  /** ID of the question to regenerate */
  questionId: z.string(),

  /** Original question (for context) */
  originalQuestion: ExamQuestionSchema.optional(),

  /** User instruction for regeneration */
  instruction: z.string().min(1),

  /** Optional overrides for question properties */
  overrides: z
    .object({
      type: QuestionTypeEnum.optional(),
      difficulty: DifficultyEnum.optional(),
      taxonomyLevel: TaxonomyLevelEnum.optional(),
      topic: z.string().optional(),
    })
    .optional(),

  /** Language for generation */
  language: z.enum(["es", "en"]).default("es"),

  /** Current exam context (for maintaining coherence) */
  currentExam: z
    .object({
      title: z.string().optional(),
      subject: z.string().optional(),
      level: z.string().optional(),
      // Permissive validation - only used for context, not strict validation
      questions: z.array(z.record(z.unknown())),
    })
    .optional(),

  /** Document summaries (for additional context) */
  documentSummaries: z
    .array(
      z.object({
        documentId: z.string(),
        summary: TopicSummarySchema,
      })
    )
    .optional(),
});

/**
 * Output schema for regenerate question tool
 */
const outputSchema = z.object({
  /** Regenerated question */
  question: ExamQuestionSchema,

  /** Metadata about regeneration */
  metadata: z.object({
    /** Original question ID */
    questionId: z.string(),

    /** What changed */
    changes: z.string(),
  }),
});

/**
 * Regenerate Question Tool
 *
 * Regenerates a single question based on user instructions
 * while maintaining its ID and optionally its context.
 */
export const regenerateQuestionTool = createTool({
  id: "regenerate-question",
  description:
    "Regenerates a specific question based on user instructions. " +
    "Maintains question ID and allows targeted modifications " +
    "(e.g., 'make it harder', 'change topic to X', 'add more options').",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const {
      questionId,
      originalQuestion,
      instruction,
      overrides,
      language,
      currentExam,
      documentSummaries,
    } = context;

    // Auto-extract originalQuestion from currentExam if not provided
    let effectiveOriginalQuestion = originalQuestion;
    if (!effectiveOriginalQuestion && currentExam) {
      const found = currentExam.questions.find(
        (q) => (q as { id?: string }).id === questionId
      );

      if (!found) {
        throw new Error(
          `Question with ID "${questionId}" not found in current exam`
        );
      }

      // Cast to ExamQuestion for use in prompt building
      effectiveOriginalQuestion = found as unknown as ExamQuestion;
    }

    // Build prompt
    const prompt = buildRegeneratePrompt({
      questionId,
      originalQuestion: effectiveOriginalQuestion,
      instruction,
      overrides,
      language,
      currentExam,
      documentSummaries,
    });

    // Call LLM
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter(
      process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite"
    );

    const languageName = language === "es" ? "Spanish" : language === "en" ? "English" : language;

    try {
      const response = await generateText({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert in creating educational exams.

**OUTPUT LANGUAGE: ${languageName} (ISO 639-1: "${language}")**
ALL question content MUST be in ${languageName}.

**BLOOM'S TAXONOMY LEVELS (USE EXACT VALUES):**
The "taxonomy" field must be ONE of these EXACT values:
- "remember": Recall facts, terms, concepts
- "understand": Explain ideas, summarize
- "apply": Use knowledge in new situations
- "analyze": Break down, compare
- "evaluate": Judge, critique
- "create": Design, construct

**CRITICAL RULES:**
Return EXCLUSIVELY valid JSON, without comments.
FORBIDDEN to use Markdown or code fences.
For multiple_choice: the "answer" field must be the FULL TEXT of the correct option, NEVER an index.
The "taxonomy" field is MANDATORY and must use one of the exact values listed above.

**FORMULAS AND MATHEMATICAL NOTATION:**
If the question involves formulas, equations, or scientific notation, use LaTeX syntax:
- Inline formulas: $...$ (e.g., $E=mc^2$, $\\Delta p$, $\\alpha$)
- Display formulas: \\[...\\] (e.g., \\[\\int_a^b f(x)dx\\])
- Write commands with ONE backslash: \\frac, \\alpha, \\Delta (JSON escaping is automatic)
- Common functions: \\int, \\frac{num}{den}, \\sin, \\cos, \\sqrt{...}
- AVOID plain text like "Deltap" - use $\\Delta p$ instead
- Chemistry: Use \\text{} in formulas, e.g., $\\text{H}_2\\text{O}$`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      // Parse response
      const parsed = parseQuestionResponse(response.text) as Record<string, unknown>;

      // Ensure ID is preserved
      parsed.id = questionId;

      // Validate
      const validated = ExamQuestionSchema.parse(parsed);

      return {
        question: validated,
        metadata: {
          questionId,
          changes: instruction,
        },
      };
    } catch (error) {
      logger.error("Error regenerating question:", error);
      throw new Error(
        `Failed to regenerate question: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Builds the prompt for question regeneration
 */
function buildRegeneratePrompt(params: {
  questionId: string;
  originalQuestion?: ExamQuestion;
  instruction: string;
  overrides?: QuestionOverrides;
  language: string;
  currentExam?: {
    title?: string;
    subject?: string;
    level?: string;
    questions: Record<string, unknown>[];
  };
  documentSummaries?: unknown[];
}): string {
  const { questionId, originalQuestion, instruction, overrides, language, currentExam, documentSummaries } =
    params;

  const languageName = language === "es" ? "Spanish" : language === "en" ? "English" : language;

  let prompt = `Regenerate question "${questionId}" in ${languageName} (ISO 639-1: "${language}") according to the following instruction:\n\n**Instruction:** ${instruction}\n\n`;

  // Add exam context for coherence
  if (currentExam) {
    prompt += `**EXAM CONTEXT (CRITICAL - Must maintain coherence):**\n`;

    if (currentExam.title) {
      prompt += `- Exam Title: ${currentExam.title}\n`;
    }
    if (currentExam.subject) {
      prompt += `- Subject/Topic: ${currentExam.subject}\n`;
    }
    if (currentExam.level) {
      prompt += `- Academic Level: ${currentExam.level}\n`;
    }

    // Show other questions for context
    if (currentExam.questions && currentExam.questions.length > 0) {
      prompt += `- Number of questions in exam: ${currentExam.questions.length}\n`;
      prompt += `- Other question topics: ${currentExam.questions
        .filter(q => (q as { id?: string }).id !== questionId)
        .slice(0, 3)
        .map(q => {
          const tags = (q as { tags?: string[] }).tags;
          return Array.isArray(tags) ? tags.join(', ') : 'N/A';
        })
        .join('; ')}\n`;
    }

    prompt += `\n**IMPORTANT:** The regenerated question MUST be related to the exam subject (${currentExam.subject || 'the main topic'}) and maintain coherence with other questions. Do NOT change the topic to something unrelated.\n\n`;
  }

  // Add document summaries if available
  if (documentSummaries && documentSummaries.length > 0) {
    prompt += `**Document Context:**\nThis exam is based on ${documentSummaries.length} document(s). Keep the question relevant to the provided materials.\n\n`;
  }

  // Add original question for context
  if (originalQuestion) {
    prompt += `**Original question:**\n${JSON.stringify(originalQuestion, null, 2)}\n\n`;
  }

  // Add overrides if specified
  if (overrides) {
    prompt += `**Mandatory requirements:**\n`;

    if (overrides.type) {
      prompt += `- Type: ${overrides.type}\n`;
    }
    if (overrides.difficulty) {
      prompt += `- Difficulty: ${overrides.difficulty}\n`;
    }
    if (overrides.taxonomyLevel) {
      prompt += `- Taxonomy: ${overrides.taxonomyLevel}\n`;
    }
    if (overrides.topic) {
      prompt += `- Topic: ${overrides.topic}\n`;
    }

    prompt += "\n";
  }

  // Add output format
  prompt += `Return a JSON object with the complete question in ${languageName} (id, type, prompt, options, answer, rationale, difficulty, taxonomy, tags). Keep the ID as "${questionId}".`;

  return prompt;
}

/**
 * Parses the LLM response into a question object
 */
function parseQuestionResponse(responseText: string): unknown {
  try {
    // Remove code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Handle different formats
    if (parsed.question) {
      return parsed.question;
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    } else {
      return parsed;
    }
  } catch (error) {
    logger.error("Failed to parse question response:", responseText);
    throw new Error(
      `Invalid question format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
