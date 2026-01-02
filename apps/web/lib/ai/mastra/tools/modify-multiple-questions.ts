/**
 * Modify Multiple Questions Tool
 *
 * Modifies multiple questions simultaneously based on user instructions.
 * Uses parallel chunk processing for efficiency.
 *
 * This tool allows users to modify several questions at once
 * (e.g., "make questions 3, 7, and 12 harder").
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Question Modification Tools
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
  ExamSchema,
  type ExamQuestion,
} from "../schemas";
import { logger } from "@/lib/utils/logger";

/**
 * Single modification specification
 */
const ModificationSpecSchema = z.object({
  /** ID of the question to modify */
  questionId: z.string(),

  /** User instruction for this modification */
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
});

type ModificationSpec = z.infer<typeof ModificationSpecSchema>;

/**
 * Input schema for modify multiple questions tool
 */
const inputSchema = z.object({
  /** Array of modifications to apply */
  modifications: z.array(ModificationSpecSchema).min(1),

  /** Current exam context (MANDATORY for coherence) */
  currentExam: z.object({
    title: z.string().optional(),
    subject: z.string().optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    questions: z.array(z.record(z.unknown())),
  }),

  /** Language for generation */
  language: z.enum(["es", "en", "fr", "pt"]).default("en"),

  /** Optional chunk size (auto-calculated if not provided) */
  chunkSize: z.number().int().min(1).max(5).optional(),
});

/**
 * Output schema for modify multiple questions tool
 */
const outputSchema = z.object({
  /** Exam with modified questions */
  exam: ExamSchema,

  /** Modification metadata */
  metadata: z.object({
    /** IDs of modified questions */
    modifiedIds: z.array(z.string()),

    /** IDs of questions that failed to modify */
    failedIds: z.array(z.string()).optional(),

    /** Number of chunks used */
    chunksUsed: z.number(),

    /** Average time per chunk (seconds) */
    avgTimePerChunk: z.number().optional(),

    /** Any errors encountered */
    errors: z.array(z.string()).optional(),
  }),
});

/**
 * Modify Multiple Questions Tool
 *
 * Modifies multiple questions simultaneously using parallel
 * chunk processing for efficiency.
 */
export const modifyMultipleQuestionsTool = createTool({
  id: "modify-multiple-questions",
  description:
    "Modifies multiple questions simultaneously based on user instructions. " +
    "Use this when user requests changes to 2 or more questions at once " +
    "(e.g., 'make questions 3, 7, and 12 harder', 'improve questions 5 through 10'). " +
    "For single question modifications, use regenerateQuestion instead.",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { modifications, currentExam, language, chunkSize } = context;

    const startTime = Date.now();

    logger.log(
      `Modifying ${modifications.length} questions in exam with ${currentExam.questions.length} total questions`
    );

    // Step 1: Validate all question IDs exist in exam
    const validationErrors: string[] = [];
    const availableIds = currentExam.questions.map(
      (q) => (q as { id?: string }).id || ""
    );

    for (const mod of modifications) {
      if (!availableIds.includes(mod.questionId)) {
        validationErrors.push(
          `Question ${mod.questionId} not found in exam. Available IDs: ${availableIds.join(", ")}`
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed:\n${validationErrors.join("\n")}`
      );
    }

    // Step 2: Calculate optimal chunk size (default 3-5 modifications per chunk)
    const optimalChunkSize = chunkSize || calculateOptimalChunkSize(modifications.length);

    // Step 3: Divide into chunks
    const chunks = chunkModifications(modifications, optimalChunkSize);

    logger.log(
      `Processing ${modifications.length} modifications in ${chunks.length} chunks (size: ${optimalChunkSize})`
    );

    // Prepare LLM client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter(
      process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite"
    );

    const modifiedQuestions: Map<string, ExamQuestion> = new Map();
    const errors: string[] = [];
    const failedIds: string[] = [];
    const chunkTimes: number[] = [];

    // Step 4: Process chunks in parallel
    const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
      const chunkStartTime = Date.now();

      try {
        // Get original questions for this chunk
        const originalQuestions = chunk.map((mod) => {
          const found = currentExam.questions.find(
            (q) => (q as { id?: string }).id === mod.questionId
          );
          return {
            ...mod,
            originalQuestion: found as unknown as ExamQuestion,
          };
        });

        // Build batch prompt
        const prompt = buildBatchModifyPrompt({
          modifications: originalQuestions,
          language,
          currentExam,
        });

        // Call LLM
        const response = await generateText({
          model,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(language),
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        // Parse response (expecting array of questions)
        const parsed = parseQuestionsResponse(response.text);

        // Validate each question and preserve IDs
        for (let i = 0; i < parsed.length; i++) {
          const mod = chunk[i];
          if (!mod) continue;

          try {
            // Ensure ID is preserved
            parsed[i].id = mod.questionId;

            // Validate
            const validated = ExamQuestionSchema.parse(parsed[i]);
            modifiedQuestions.set(mod.questionId, validated);

            logger.log(`Modified question ${mod.questionId} successfully`);
          } catch (error) {
            const errorMsg = `Question ${mod.questionId}: ${error instanceof Error ? error.message : "Validation failed"}`;
            errors.push(errorMsg);
            failedIds.push(mod.questionId);
            logger.error(`Validation error for ${mod.questionId}:`, error);
          }
        }

        // Track chunk time
        const chunkTime = (Date.now() - chunkStartTime) / 1000;
        chunkTimes.push(chunkTime);

        logger.log(
          `Chunk ${chunkIndex + 1}/${chunks.length} completed in ${chunkTime.toFixed(2)}s`
        );
      } catch (error) {
        // Log error but don't block other chunks
        const errorMsg = `Chunk ${chunkIndex + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error);

        // Mark all questions in chunk as failed
        for (const mod of chunk) {
          failedIds.push(mod.questionId);
        }
      }
    });

    // Wait for all chunks to complete
    await Promise.all(chunkPromises);

    // Step 5: Merge modified questions back into exam
    const mergedQuestions = currentExam.questions.map((q) => {
      const questionId = (q as { id?: string }).id;
      if (questionId && modifiedQuestions.has(questionId)) {
        return modifiedQuestions.get(questionId)!;
      }
      return q as unknown as ExamQuestion;
    });

    // Calculate average chunk time
    const avgTimePerChunk =
      chunkTimes.length > 0
        ? chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length
        : 0;

    const totalTime = (Date.now() - startTime) / 1000;
    logger.log(
      `Modified ${modifiedQuestions.size}/${modifications.length} questions in ${totalTime.toFixed(2)}s`
    );

    return {
      exam: {
        exam: {
          title: currentExam.title || "",
          subject: currentExam.subject || "",
          level: currentExam.level || "",
          language: currentExam.language || language,
          questions: mergedQuestions,
        },
      },
      metadata: {
        modifiedIds: Array.from(modifiedQuestions.keys()),
        failedIds: failedIds.length > 0 ? failedIds : undefined,
        chunksUsed: chunks.length,
        avgTimePerChunk,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  },
});

/**
 * Calculate optimal chunk size based on number of modifications
 */
function calculateOptimalChunkSize(totalModifications: number): number {
  if (totalModifications <= 3) return totalModifications;
  if (totalModifications <= 10) return 3;
  if (totalModifications <= 20) return 4;
  return 5;
}

/**
 * Divide modifications into chunks
 */
function chunkModifications(
  modifications: ModificationSpec[],
  chunkSize: number
): ModificationSpec[][] {
  const chunks: ModificationSpec[][] = [];

  for (let i = 0; i < modifications.length; i += chunkSize) {
    chunks.push(modifications.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Build system prompt for question modification
 */
function buildSystemPrompt(language: string): string {
  const languageName =
    language === "es" ? "Spanish" : language === "en" ? "English" : language;

  return `You are an expert in creating educational exams.

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
Return EXCLUSIVELY valid JSON array of question objects, without comments.
FORBIDDEN to use Markdown or code fences.
For multiple_choice: the "answer" field must be the FULL TEXT of the correct option, NEVER an index.
The "taxonomy" field is MANDATORY and must use one of the exact values listed above.

**FORMULAS AND MATHEMATICAL NOTATION:**
If the question involves formulas, equations, or scientific notation, use LaTeX syntax:
- Inline formulas: $...$ (e.g., $E=mc^2$, $\\Delta p$, $\\alpha$)
- Display formulas: \\[...\\] (e.g., \\[\\int_a^b f(x)dx\\])
- **ESCAPING - CRITICAL**: LaTeX in JSON MUST use backslash escape:
  * "\\frac{a}{b}" ✓, "\frac" ❌ (corrupts to "␌rac")
  * "\\theta" ✓, "\theta" ❌ (corrupts to "[TAB]heta")
  * "\\begin{pmatrix}" ✓, "\begin{pmatrix}" ❌ (corrupts)
  * "\\\\frac" ❌ (double-escaped)
- Conflicting commands: \\beta, \\begin (\\b), \\frac, \\phi (\\f), \\nabla, \\neq (\\n), \\rho (\\r), \\theta, \\tan, pmatrix (\\t)
- AVOID plain text like "Deltap" - use $\\Delta p$ instead
- Chemistry: Use \\text{} in formulas, e.g., $\\text{H}_2\\text{O}$
- **ACCENTED CHARACTERS**: Wrap ñ, á, é, í, ó, ú in \\text{} inside math mode, e.g., $\\text{año}$, NOT $año$`;
}

/**
 * Build batch modification prompt
 */
function buildBatchModifyPrompt(params: {
  modifications: Array<
    ModificationSpec & { originalQuestion: ExamQuestion }
  >;
  language: string;
  currentExam: {
    title?: string;
    subject?: string;
    level?: string;
    questions: Record<string, unknown>[];
  };
}): string {
  const { modifications, language, currentExam } = params;

  const languageName =
    language === "es" ? "Spanish" : language === "en" ? "English" : language;

  let prompt = `Modify the following ${modifications.length} questions in ${languageName} (ISO 639-1: "${language}") according to their respective instructions:\n\n`;

  // Add exam context for coherence
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
  prompt += `- Total questions in exam: ${currentExam.questions.length}\n\n`;

  prompt += `**IMPORTANT:** All modified questions MUST be related to the exam subject (${currentExam.subject || "the main topic"}) and maintain coherence with other questions. Do NOT change topics to something unrelated.\n\n`;

  // Add each modification
  prompt += `**Questions to modify:**\n\n`;

  for (let i = 0; i < modifications.length; i++) {
    const mod = modifications[i];
    prompt += `${i + 1}. **Question ID: ${mod.questionId}**\n`;
    prompt += `   **Instruction:** ${mod.instruction}\n`;

    // Add overrides if specified
    if (mod.overrides) {
      prompt += `   **Requirements:**\n`;
      if (mod.overrides.type) {
        prompt += `   - Type: ${mod.overrides.type}\n`;
      }
      if (mod.overrides.difficulty) {
        prompt += `   - Difficulty: ${mod.overrides.difficulty}\n`;
      }
      if (mod.overrides.taxonomyLevel) {
        prompt += `   - Taxonomy: ${mod.overrides.taxonomyLevel}\n`;
      }
      if (mod.overrides.topic) {
        prompt += `   - Topic: ${mod.overrides.topic}\n`;
      }
    }

    prompt += `   **Original question:**\n`;
    prompt += `   \`\`\`json\n   ${JSON.stringify(mod.originalQuestion, null, 2)}\n   \`\`\`\n\n`;
  }

  // Add output format
  prompt += `\n**OUTPUT FORMAT:**\n`;
  prompt += `Return a JSON array with ${modifications.length} question objects in ${languageName}.\n`;
  prompt += `Each question must have: id, type, prompt, options, answer, rationale, difficulty, taxonomy, tags.\n`;
  prompt += `Preserve the original IDs: ${modifications.map((m) => m.questionId).join(", ")}.\n`;
  prompt += `\nReturn ONLY the JSON array, no additional text or code fences.`;

  return prompt;
}

/**
 * Sanitizes JSON string to fix common LLM LaTeX errors
 */
function sanitizeJSON(jsonString: string): string {
  // Fix 1: Double-escaped LaTeX commands (\\\\alpha → \\alpha)
  let sanitized = jsonString.replace(/\\\\\\\\([a-zA-Z]+)/g, "\\\\$1");

  // Fix 2: LaTeX commands that conflict with JSON escapes
  // CRITICAL: JSON escapes \b \f \n \r \t appear in LaTeX commands
  // Examples: \frac, \beta, \nabla, \rho, \theta, \begin{pmatrix}
  sanitized = sanitized.replace(/\\([bfnrt])([a-zA-Z])/g, "\\\\$1$2");

  // Fix 3: Unescaped backslashes (but not already escaped)
  sanitized = sanitized.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

  return sanitized;
}

/**
 * Parse LLM response into array of question objects
 */
function parseQuestionsResponse(responseText: string): Record<string, unknown>[] {
  try {
    // Remove code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Sanitize LaTeX escaping issues
    cleaned = sanitizeJSON(cleaned);

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Handle different formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions;
    } else if (parsed.exam?.questions && Array.isArray(parsed.exam.questions)) {
      return parsed.exam.questions;
    } else {
      // Single question returned - wrap in array
      return [parsed];
    }
  } catch (error) {
    logger.error("Failed to parse questions response:", responseText);
    throw new Error(
      `Invalid questions format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
