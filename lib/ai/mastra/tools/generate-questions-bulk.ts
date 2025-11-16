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
  type ExamQuestion,
  type QuestionSpec,
  type TopicSummary,
} from "../schemas";
import { chunkQuestionSpecs, calculateOptimalChunkSize } from "../utils";

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
      documentSummaries: z.array(z.any()).optional(),

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

    console.log(
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
            console.error(`Validation error for ${questionId}:`, error);
          }
        }

        // Track chunk time
        const chunkTime = (Date.now() - chunkStartTime) / 1000;
        chunkTimes.push(chunkTime);

        console.log(
          `Chunk ${chunkIndex + 1}/${chunks.length} completed in ${chunkTime.toFixed(2)}s (${validatedQuestions.length}/${chunk.length} questions)`
        );

        return validatedQuestions;
      } catch (error) {
        // Log error but don't block other chunks
        const errorMsg = `Chunk ${chunkIndex + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);

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

    console.log(
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

**CRITICAL RULES:**
1. Return EXCLUSIVELY valid JSON, without comments or external explanations
2. FORBIDDEN to use Markdown or code fences (do not use \`\`\`json)
3. For multiple_choice questions: the "answer" field must be the FULL TEXT of the correct option, NEVER a numeric index
4. Incorrect options must be plausible but clearly wrong
5. Each question must include a brief "rationale" explaining the correct answer (in ${languageName})
6. Tags must be in ${languageName} (e.g., ${exampleTags})
7. If using mathematical/chemical formulas or expressions, represent them in LaTeX with $...$ (inline) or \\[...\\] (display)
8. Don't add extra backslashes; JSON escaping is applied automatically

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
    documentSummaries?: TopicSummary[];
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
 * Parses the LLM response into questions array
 */
function parseQuestionsResponse(responseText: string): any[] {
  try {
    // Remove code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON
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
  } catch (error) {
    console.error("Failed to parse questions response:", responseText);
    throw new Error(
      `Invalid questions format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
