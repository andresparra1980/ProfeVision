/**
 * Generate Questions in Bulk Tool
 *
 * Generates exam questions in parallel chunks based on specifications.
 * Provides progress tracking and error recovery.
 *
 * This tool is the core of the exam generation pipeline. It takes
 * question specifications (from planExamGeneration) and generates
 * full questions in parallel chunks for efficiency.
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.4
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  ExamQuestionSchema,
  QuestionSpecSchema,
  TopicSummarySchema,
  type ExamQuestion,
  type QuestionSpec,
  type TopicSummary,
} from "../schemas";
import { chunkQuestionSpecs, calculateOptimalChunkSize } from "../utils";
import { logger } from "@/lib/utils/logger";

/**
 * Input schema for generate questions in bulk tool
 */
const inputSchema = z.object({
  /** Array of question specifications to generate */
  questionSpecs: z.array(QuestionSpecSchema).min(1),

  /** Optional context for generation */
  context: z
    .object({
      /** Document summaries for context */
      documentSummaries: z
        .array(
          z.object({
            documentId: z.string(),
            summary: TopicSummarySchema,
          })
        )
        .optional(),

      /** Language for generation (ISO 639-1) */
      language: z.enum(["es", "en"]).default("es"),

      /** Additional instructions */
      additionalInstructions: z.string().optional(),
    })
    .optional(),

  /** Optional chunk size (auto-calculated if not provided) */
  chunkSize: z.number().int().min(1).max(10).optional(),
});

/**
 * Output schema for generate questions in bulk tool
 */
const outputSchema = z.object({
  /** Generated questions */
  questions: z.array(ExamQuestionSchema),

  /** Generation metadata */
  metadata: z.object({
    /** Total questions requested */
    totalRequested: z.number(),

    /** Successfully generated */
    totalGenerated: z.number(),

    /** Number of chunks used */
    chunksUsed: z.number(),

    /** Average time per chunk (seconds) */
    avgTimePerChunk: z.number().optional(),

    /** Any errors encountered */
    errors: z.array(z.string()).optional(),
  }),
});

/**
 * Generate Questions in Bulk Tool
 *
 * Generates full exam questions from specifications using parallel
 * chunk processing for efficiency.
 */
export const generateQuestionsInBulkTool = createTool({
  id: "generate-questions-bulk",
  description:
    "Generates exam questions in parallel chunks based on specifications. " +
    "Takes question specs (id, topic, type, difficulty) and generates full questions " +
    "(prompt, options, answer, rationale). Supports progress tracking and error recovery.",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const { questionSpecs, context: genContext, chunkSize } = context;

    const startTime = Date.now();
    const language = genContext?.language || "es";

    // Calculate optimal chunk size
    const optimalChunkSize =
      chunkSize || calculateOptimalChunkSize(questionSpecs.length);

    // Divide into chunks
    const chunks = chunkQuestionSpecs(questionSpecs, optimalChunkSize);

    logger.log(
      `Generating ${questionSpecs.length} questions in ${chunks.length} chunks (size: ${optimalChunkSize})`
    );

    // Prepare LLM client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter(
      process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite"
    );

    const allQuestions: ExamQuestion[] = [];
    const errors: string[] = [];
    const chunkTimes: number[] = [];

    // Process chunks in parallel
    const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
      const chunkStartTime = Date.now();

      try {
        // Build prompt for this chunk
        const prompt = buildChunkPrompt(chunk, language, genContext);

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

        // Parse response
        const parsed = parseQuestionsResponse(response.text);

        // Validate each question
        const validatedQuestions: ExamQuestion[] = [];
        for (let i = 0; i < parsed.length; i++) {
          try {
            const validated = ExamQuestionSchema.parse(parsed[i]);
            validatedQuestions.push(validated);
          } catch (error) {
            const questionId = chunk[i]?.id || `chunk${chunkIndex}_q${i}`;
            errors.push(
              `Question ${questionId}: ${error instanceof Error ? error.message : "Validation failed"}`
            );
            logger.error(`Validation error for ${questionId}:`, error);
          }
        }

        // Track chunk time
        const chunkTime = (Date.now() - chunkStartTime) / 1000;
        chunkTimes.push(chunkTime);

        logger.log(
          `Chunk ${chunkIndex + 1}/${chunks.length} completed in ${chunkTime.toFixed(2)}s (${validatedQuestions.length}/${chunk.length} questions)`
        );

        return validatedQuestions;
      } catch (error) {
        // Log error but don't block other chunks
        const errorMsg = `Chunk ${chunkIndex + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error);

        // Return empty array for failed chunk
        return [];
      }
    });

    // Wait for all chunks to complete
    const chunkResults = await Promise.all(chunkPromises);

    // Flatten results
    for (const questions of chunkResults) {
      allQuestions.push(...questions);
    }

    // Calculate average chunk time
    const avgTimePerChunk =
      chunkTimes.length > 0
        ? chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length
        : 0;

    const totalTime = (Date.now() - startTime) / 1000;

    logger.log(
      `Bulk generation completed: ${allQuestions.length}/${questionSpecs.length} questions in ${totalTime.toFixed(2)}s`
    );

    return {
      questions: allQuestions,
      metadata: {
        totalRequested: questionSpecs.length,
        totalGenerated: allQuestions.length,
        chunksUsed: chunks.length,
        avgTimePerChunk,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  },
});

/**
 * Builds the system prompt for question generation
 */
function buildSystemPrompt(language: string): string {
  const languageName = language === "es" ? "Spanish" : language === "en" ? "English" : language;
  const examplePrompt = language === "es" ? "¿Qué es la fotosíntesis?" : "What is photosynthesis?";
  const exampleOptions = language === "es"
    ? '["Proceso de respiración", "Proceso de nutrición autótrofa", "Proceso de reproducción", "Proceso de excreción"]'
    : '["Respiration process", "Autotrophic nutrition process", "Reproduction process", "Excretion process"]';
  const exampleAnswer = language === "es" ? "Proceso de nutrición autótrofa" : "Autotrophic nutrition process";
  const exampleRationale = language === "es"
    ? "La fotosíntesis es el proceso por el cual las plantas producen su propio alimento usando luz solar."
    : "Photosynthesis is the process by which plants produce their own food using sunlight.";
  const exampleTags = language === "es" ? '["biología", "plantas", "fotosíntesis"]' : '["biology", "plants", "photosynthesis"]';

  return `You are an expert in creating high-quality educational exams.

**OUTPUT LANGUAGE: ${languageName} (ISO 639-1: "${language}")**
ALL question content (prompt, options, answer, rationale, tags) MUST be in ${languageName}.

**BLOOM'S TAXONOMY LEVELS (MANDATORY - USE EXACT VALUES):**
The "taxonomy" field must be ONE of these EXACT values:
- "remember": Recall facts, terms, concepts, definitions (e.g., "What is X?", "Define Y")
- "understand": Explain ideas, summarize, classify (e.g., "Explain why...", "Summarize...")
- "apply": Use knowledge in new situations (e.g., "Calculate...", "Apply this formula...")
- "analyze": Break down, compare, contrast (e.g., "Compare X and Y", "Analyze the cause...")
- "evaluate": Judge, critique, justify (e.g., "Evaluate the effectiveness...", "Which approach is best?")
- "create": Design, construct, generate (e.g., "Design a solution...", "Create a plan...")

**CRITICAL RULES:**
1. Return EXCLUSIVELY valid JSON, without comments or external explanations
2. FORBIDDEN to use Markdown or code fences (do not use \`\`\`json)
3. For multiple_choice questions: the "answer" field must be the FULL TEXT of the correct option, NEVER a numeric index
4. Incorrect options must be plausible but clearly wrong
5. Each question must include a brief "rationale" explaining the correct answer (in ${languageName})
6. Tags must be in ${languageName} (e.g., ${exampleTags})
7. **MATHEMATICAL AND CHEMICAL FORMULAS - CRITICAL:**
   - If prompts or options include formulas, equations, mathematical expressions, or chemical notation, REPRESENT them in LaTeX (NOT Markdown)
   - Use delimiters: $...$ for inline (e.g., $E=mc^2$, $\\Delta p$, $\\alpha$) and \\[...\\] for display (e.g., \\[\\int_0^1 x^2 \\; dx\\])
   - Common functions: \\int, \\frac{numerator}{denominator}, \\sin, \\cos, \\sqrt{...}, superscripts with ^, subscripts with _
   - Write LaTeX commands with ONE backslash per command (\\alpha, \\Delta, \\frac) - JSON escaping is applied automatically
   - Examples in JSON strings: "$\\\\Delta p$" renders as Δp, "$E=mc^2$" renders correctly, "\\[\\int_a^b f(x)dx\\]" for integrals
   - AVOID writing plain text like "Deltap" or "alpha" - always use proper LaTeX syntax: $\\Delta p$, $\\alpha$
   - For chemistry: Use \\text{} for text in formulas, e.g., $\\text{H}_2\\text{O}$, $\\text{C}_6\\text{H}_{12}\\text{O}_6$
   - **ACCENTED CHARACTERS (ñ, á, é, í, ó, ú, etc.)**: ALWAYS wrap in \\text{} when inside math mode, e.g., $\\text{año}$, $v = \\frac{d}{t}$ (use symbols), NOT $año$ or $distancia$ (causes Unicode errors)
8. Don't add extra backslashes beyond standard LaTeX syntax; JSON escaping is applied automatically
9. The "taxonomy" field is MANDATORY and must use one of the exact values listed above

**OUTPUT FORMAT:**
Return a JSON array of questions. Example (in ${languageName}):
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "prompt": "${examplePrompt}",
    "options": ${exampleOptions},
    "answer": "${exampleAnswer}",
    "rationale": "${exampleRationale}",
    "difficulty": "easy",
    "taxonomy": "remember",
    "tags": ${exampleTags}
  }
]`;
}

/**
 * Builds the prompt for generating a chunk of questions
 */
function buildChunkPrompt(
  specs: QuestionSpec[],
  language: string,
  context?: {
    documentSummaries?: Array<{
      documentId: string;
      summary: TopicSummary;
    }>;
    additionalInstructions?: string;
  }
): string {
  const languageName = language === "es" ? "Spanish" : language === "en" ? "English" : language;

  let prompt = `Generate exactly ${specs.length} exam questions in ${languageName} (ISO 639-1: "${language}") based on the following specifications:\n\n`;

  // Add specs
  specs.forEach((spec, i) => {
    prompt += `**Question ${i + 1} (ID: ${spec.id}):**
- Topic: ${spec.topic}
- Guidance: ${spec.examplePrompt}
- Type: ${spec.type}
- Difficulty: ${spec.difficulty}
${spec.taxonomyLevel ? `- Taxonomy (Bloom): ${spec.taxonomyLevel}` : ""}

`;
  });

  // Add document context if available
  if (context?.documentSummaries && context.documentSummaries.length > 0) {
    prompt += `\n**Document context:**\nUse this context to align content, but DO NOT cite it literally in questions:\n${JSON.stringify(context.documentSummaries)}\n\n`;
  }

  // Add additional instructions
  if (context?.additionalInstructions) {
    prompt += `\n${context.additionalInstructions}\n\n`;
  }

  // Add output format reminder
  prompt += `\nReturn a JSON array with exactly ${specs.length} questions in ${languageName}. Each question must have all required fields: id, type, prompt, options (if applicable), answer, rationale, difficulty, taxonomy, tags.`;

  return prompt;
}

/**
 * Attempts to sanitize common JSON issues from LLM output
 */
function sanitizeJSON(jsonString: string): string {
  // This is a best-effort attempt to fix common LLM JSON errors
  // Note: This is fragile and may not work for all cases

  // Fix unescaped backslashes in strings (but not already escaped)
  // This is tricky - we only want to fix literal backslashes that aren't escape sequences
  // We'll use a heuristic: if backslash is followed by a character that's not a valid escape, escape it
  // Valid escapes: \" \\ \/ \b \f \n \r \t \uXXXX
  const sanitized = jsonString.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

  return sanitized;
}

/**
 * Parses the LLM response into questions array
 */
function parseQuestionsResponse(responseText: string): unknown[] {
  // Remove code fences if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Try parsing directly first
  try {
    const parsed = JSON.parse(cleaned);

    // Handle different response formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions;
    } else if (parsed.exam?.questions && Array.isArray(parsed.exam.questions)) {
      return parsed.exam.questions;
    } else {
      throw new Error("Response is not an array of questions");
    }
  } catch (firstError) {
    // Try sanitizing and parsing again
    logger.log("First parse failed, attempting sanitization...");
    try {
      const sanitized = sanitizeJSON(cleaned);
      const parsed = JSON.parse(sanitized);

      logger.log("Sanitization successful, JSON parsed after fixing escape issues");

      // Handle different response formats
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      } else if (parsed.exam?.questions && Array.isArray(parsed.exam.questions)) {
        return parsed.exam.questions;
      } else {
        throw new Error("Response is not an array of questions");
      }
    } catch (secondError) {
      // Both attempts failed - extract error context and fail
      let errorContext = "";
      const error = secondError; // Use the most recent error for context
      if (error instanceof SyntaxError && error.message.includes("position")) {
        const positionMatch = error.message.match(/position (\d+)/);
        if (positionMatch) {
          const position = parseInt(positionMatch[1], 10);
          const start = Math.max(0, position - 100);
          const end = Math.min(cleaned.length, position + 100);
          const snippet = cleaned.substring(start, end);
          const markerPos = position - start;
          errorContext = `\nError near position ${position}:\n${snippet.substring(0, markerPos)}<<<ERROR HERE>>>${snippet.substring(markerPos)}`;
        }
      }

      logger.error("Failed to parse questions response after sanitization", {
        firstError: firstError instanceof Error ? firstError.message : "Unknown",
        secondError: secondError instanceof Error ? secondError.message : "Unknown",
        responseLength: responseText.length,
        snippet: errorContext || responseText.substring(0, 500),
      });

      throw new Error(
        `Invalid questions format: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
