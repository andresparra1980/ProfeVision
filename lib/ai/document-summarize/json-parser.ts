import logger from "@/lib/utils/logger";
import { summarySchema, TopicSummaryResult } from "./schemas";

/**
 * Extract and parse JSON from AI response
 */
export function parseJSONResponse(content: string): {
  success: boolean;
  data?: TopicSummaryResult;
  error?: string;
  code?: string;
} {
  let jsonObj: unknown;

  try {
    jsonObj = JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown or text
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        jsonObj = JSON.parse(match[0]);
      } catch {
        return {
          success: false,
          error: "Model did not return valid JSON content",
          code: "PARSE_ERROR",
        };
      }
    } else {
      return {
        success: false,
        error: "Model did not return JSON content",
        code: "PARSE_ERROR",
      };
    }
  }

  // Validate against schema
  const validated = summarySchema.safeParse(jsonObj);
  if (!validated.success) {
    logger.warn("Response failed schema validation", {
      error: validated.error.message,
      preview: JSON.stringify(jsonObj).slice(0, 500),
    });
    return {
      success: false,
      error: "Response failed schema validation: " + validated.error.message,
      code: "VALIDATION_ERROR",
    };
  }

  return {
    success: true,
    data: validated.data,
  };
}

/**
 * Validate basic structure of parsed response (defensive check)
 */
export function validateBasicStructure(
  response: unknown
): response is TopicSummaryResult {
  const pr = response as Partial<TopicSummaryResult> | undefined;
  return !!(
    pr &&
    typeof pr.generalOverview === "string" &&
    typeof pr.academicLevel === "string" &&
    Array.isArray(pr.macroTopics)
  );
}
