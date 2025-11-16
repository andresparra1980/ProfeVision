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
  type ExamQuestion,
} from "../schemas";

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
    } = context;

    // Build prompt
    const prompt = buildRegeneratePrompt({
      questionId,
      originalQuestion,
      instruction,
      overrides,
      language,
    });

    // Call LLM
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter(
      process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite"
    );

    const languageName = language === "es" ? "Español" : "English";

    try {
      const response = await generateText({
        model,
        messages: [
          {
            role: "system",
            content:
              language === "es"
                ? `Eres un experto en creación de exámenes educativos.
Devuelves EXCLUSIVAMENTE JSON válido, sin comentarios.
PROHIBIDO usar Markdown o fences de código.
Para multiple_choice: el campo "answer" debe ser el TEXTO COMPLETO de la opción correcta, NUNCA un índice.`
                : `You are an expert in creating educational exams.
Return EXCLUSIVELY valid JSON, without comments.
FORBIDDEN to use Markdown or code fences.
For multiple_choice: the "answer" field must be the FULL TEXT of the correct option, NEVER an index.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      // Parse response
      const parsed = parseQuestionResponse(response.text);

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
      console.error("Error regenerating question:", error);
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
  overrides?: any;
  language: string;
}): string {
  const { questionId, originalQuestion, instruction, overrides, language } =
    params;

  const isSpanish = language === "es";
  const languageName = isSpanish ? "Español" : "English";

  let prompt = isSpanish
    ? `Regenera la pregunta "${questionId}" en ${languageName} (código ISO 639-1: "${language}") según la siguiente instrucción:\n\n**Instrucción:** ${instruction}\n\n`
    : `Regenerate question "${questionId}" in ${languageName} (ISO 639-1 code: "${language}") according to the following instruction:\n\n**Instruction:** ${instruction}\n\n`;

  // Add original question for context
  if (originalQuestion) {
    prompt += isSpanish
      ? `**Pregunta original:**\n${JSON.stringify(originalQuestion, null, 2)}\n\n`
      : `**Original question:**\n${JSON.stringify(originalQuestion, null, 2)}\n\n`;
  }

  // Add overrides if specified
  if (overrides) {
    prompt += isSpanish ? `**Requisitos obligatorios:**\n` : `**Mandatory requirements:**\n`;

    if (overrides.type) {
      prompt += `- Tipo: ${overrides.type}\n`;
    }
    if (overrides.difficulty) {
      prompt += `- Dificultad: ${overrides.difficulty}\n`;
    }
    if (overrides.taxonomyLevel) {
      prompt += `- Taxonomía: ${overrides.taxonomyLevel}\n`;
    }
    if (overrides.topic) {
      prompt += `- Tema: ${overrides.topic}\n`;
    }

    prompt += "\n";
  }

  // Add output format
  prompt += isSpanish
    ? `Devuelve un objeto JSON con la pregunta completa (id, type, prompt, options, answer, rationale, difficulty, taxonomy, tags). Mantén el ID como "${questionId}".`
    : `Return a JSON object with the complete question (id, type, prompt, options, answer, rationale, difficulty, taxonomy, tags). Keep the ID as "${questionId}".`;

  return prompt;
}

/**
 * Parses the LLM response into a question object
 */
function parseQuestionResponse(responseText: string): any {
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
    console.error("Failed to parse question response:", responseText);
    throw new Error(
      `Invalid question format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
