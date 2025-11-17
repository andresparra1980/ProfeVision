/**
 * Plan Exam Generation Tool
 *
 * Creates a detailed plan of questions to generate based on requirements.
 * This is the first step in the exam generation pipeline.
 *
 * Instead of generating full questions immediately, this tool creates a
 * structured plan with specifications for each question. This allows for:
 * - Better control over question distribution
 * - Easier parallelization in subsequent steps
 * - Clear visibility into what will be generated
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 1.3
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  ExamPlanSchema,
  QuestionTypeEnum,
  TaxonomyLevelEnum,
  type ExamPlan,
  type TopicSummary,
} from "../schemas";
import { estimateGenerationTime } from "../utils";

/**
 * Input schema for plan exam generation tool
 */
const inputSchema = z.object({
  /** Number of questions to generate */
  numQuestions: z.number().int().min(1).max(50),

  /** Topics or subjects to cover */
  topics: z.array(z.string()).min(1),

  /** Overall difficulty level */
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),

  /** Allowed question types */
  questionTypes: z.array(QuestionTypeEnum).min(1),

  /** Optional taxonomy levels */
  taxonomyLevels: z.array(TaxonomyLevelEnum).optional(),

  /** Language for the exam */
  language: z.enum(["es", "en"]).default("es"),

  /** Optional document summaries for context */
  documentSummaries: z.array(z.any()).optional(),
});

/**
 * Output schema for plan exam generation tool
 */
const outputSchema = ExamPlanSchema;

/**
 * Plan Exam Generation Tool
 *
 * Uses AI to create a structured plan for exam generation.
 * The plan includes specifications for each question without
 * generating the full questions yet.
 */
export const planExamGenerationTool = createTool({
  id: "plan-exam-generation",
  description:
    "Creates a detailed plan for exam generation based on requirements. " +
    "Generates question specifications (topics, types, difficulty) without full questions. " +
    "This enables better control and parallelization in subsequent generation steps.",
  inputSchema,
  outputSchema,

  execute: async ({ context }) => {
    const {
      numQuestions,
      topics,
      difficulty,
      questionTypes,
      taxonomyLevels,
      language,
      documentSummaries,
    } = context;

    // Build prompt for plan generation
    const prompt = buildPlanPrompt({
      numQuestions,
      topics,
      difficulty,
      questionTypes,
      taxonomyLevels,
      language,
      documentSummaries,
    });

    // Call LLM to generate plan
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter(
      process.env.OPENAI_FALLBACK_MODEL || "mistralai/ministral-8b"
    );

    try {
      const response = await generateText({
        model,
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en diseño curricular y creación de exámenes educativos. " +
              "Devuelves exclusivamente JSON válido, sin comentarios ni explicaciones externas. " +
              "PROHIBIDO usar Markdown o fences de código. Responde SOLO con JSON plano.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Parse and validate response
      const plan = parseAndValidatePlan(response.text);

      // Add estimated generation time
      const estimatedTime = estimateGenerationTime(plan.totalQuestions);
      plan.estimatedGenerationTime = estimatedTime;

      return plan;
    } catch (error) {
      console.error("Error in plan exam generation:", error);
      throw new Error(
        `Failed to generate exam plan: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Builds the prompt for plan generation
 */
function buildPlanPrompt(params: {
  numQuestions: number;
  topics: string[];
  difficulty: string;
  questionTypes: string[];
  taxonomyLevels?: string[];
  language: string;
  documentSummaries?: TopicSummary[];
}): string {
  const {
    numQuestions,
    topics,
    difficulty,
    questionTypes,
    taxonomyLevels,
    language,
    documentSummaries,
  } = params;

  // Determine output language name
  const languageName = language === "es" ? "Spanish" : language === "en" ? "English" : language;

  const basePrompt = `Generate a detailed plan for an exam with the following characteristics:

**Requirements:**
- Total number of questions: ${numQuestions}
- Main topics: ${topics.join(", ")}
- Overall difficulty: ${difficulty}
- Allowed question types: ${questionTypes.join(", ")}
${taxonomyLevels && taxonomyLevels.length > 0 ? `- Bloom's taxonomy levels: ${taxonomyLevels.join(", ")}` : ""}

**OUTPUT LANGUAGE: ${languageName} (ISO 639-1: "${language}")**
IMPORTANT: All generated content (topics, examplePrompt, etc.) MUST be in ${languageName}.

**Instructions:**
For each question in the plan, specify:
1. **id**: Unique identifier in format "q1", "q2", "q3", etc.
2. **topic**: Specific topic or subtopic for this question (in ${languageName})
3. **examplePrompt**: Example or guidance of what the question should be like (in ${languageName}, NOT the final question)
4. **type**: Question type (one of: ${questionTypes.join(", ")})
5. **difficulty**: Specific difficulty level (easy, medium, hard)
6. **taxonomyLevel**: Bloom's taxonomy level (optional)

**Recommended distribution:**
- Balance topics proportionally
- Distribute difficulties according to the indicated general level
- Vary question types if multiple types are allowed
- Progress from lower to higher complexity when appropriate`;

  // Add document context if available
  let contextSection = "";
  if (documentSummaries && documentSummaries.length > 0) {
    contextSection = `\n\n**Document context:**\n${documentSummaries.map((ds: TopicSummary, i: number) => `Document ${i + 1}: ${JSON.stringify(ds)}`).join("\n")}\n\nUse this context to align plan topics, but don't cite it literally.`;
  }

  const jsonFormat = `\n\n**Response format (JSON):**
\`\`\`json
{
  "totalQuestions": ${numQuestions},
  "questionSpecs": [
    {
      "id": "q1",
      "topic": "Specific topic (in ${languageName})",
      "examplePrompt": "Example prompt (in ${languageName})",
      "type": "${questionTypes[0]}",
      "difficulty": "medium",
      "taxonomyLevel": "understand"
    }
  ],
  "metadata": {
    "topics": ${JSON.stringify(topics)},
    "language": "${language}"
  }
}
\`\`\``;

  return basePrompt + contextSection + jsonFormat;
}

/**
 * Parses and validates the LLM response into an ExamPlan
 */
function parseAndValidatePlan(responseText: string): ExamPlan {
  try {
    // Remove code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Validate with schema
    const validated = ExamPlanSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error("Failed to parse plan response:", responseText);
    throw new Error(
      `Invalid plan format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
