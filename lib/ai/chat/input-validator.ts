import { ChatMessage } from "./schemas";

/**
 * Validation result for user input
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Keywords and patterns that indicate off-topic queries
 */
const OFF_TOPIC_PATTERNS = [
  // Mathematical operations (not about creating exam questions)
  /\bcuanto es\b.*\d+.*[\+\-\*\/].*\d+/i,
  /\bwhat is\b.*\d+.*[\+\-\*\/].*\d+/i,
  /\bsolve\b.*\d+.*[\+\-\*\/].*\d+/i,
  /\bresuelve\b.*\d+.*[\+\-\*\/].*\d+/i,

  // General knowledge questions (not about exam creation)
  /\b(cual|cuál|what).*(es|is).*(capital|capitales|presidente|president|pa[ií]s|country|countries)/i,
  /\b(quien|quién|who).*(es|is|fue|was)/i,
  /\b(donde|dónde|where).*(es|is|está|esta|queda)/i,
  /\b(cuando|cuándo|when).*(es|is|fue|was)/i,

  // Personal/medical advice
  /\b(puedo|puede|can I|should I).*(cargar|lift|tomar|take|hacer|do).*\b(mi|my|a mi|to my).*(hijo|hija|child|bebé|baby|familia|family)/i,
  /\b(cuanto tiempo|how long|how much time).*(después|after|antes|before).*(cirug[ií]a|surgery|operaci[oó]n|operation)/i,
  /\b(consejo|advice|recomendaci[oó]n|recommendation).*(m[eé]dico|medical|salud|health)/i,

  // Conversation starters
  /^(hola|hello|hi|hey|buenos d[ií]as|good morning|buenas tardes|good afternoon)\s*[.!?]?\s*$/i,
  /^(como estas|cómo estás|how are you|como está|cómo está)\s*[.!?]?\s*$/i,

  // Model identification (unless asking about exam generation capabilities)
  /\b(que modelo eres|qué modelo eres|what model are you|which model|who are you)(?!.*exam|.*pregunta|.*question)/i,

  // Generic capabilities (not about exam features)
  /\b(puedes|can you|eres capaz|are you able).*(hacer|do|ayudar|help|resolver|solve)(?!.*exam|.*pregunta|.*question|.*examen)/i,
];

/**
 * Keywords that indicate valid exam-related queries
 */
const EXAM_RELATED_KEYWORDS = [
  // Spanish
  /\b(exam|examen|examenes|exámenes|pregunta|preguntas|question|questions)\b/i,
  /\b(generar|crear|modificar|generate|create|modify|edit)\b/i,
  /\b(evaluaci[oó]n|evaluaciones|assessment|test|quiz)\b/i,
  /\b(opci[oó]n|opciones|respuesta|respuestas|answer|answers|option|options)\b/i,
  /\b(multiple choice|opci[oó]n m[uú]ltiple|verdadero falso|true false)\b/i,
  /\b(dificultad|difficulty|nivel|level)\b/i,
  /\b(tema|temas|topic|topics|materia|subject)\b/i,
  /\b(agregar|a[ñn]adir|quitar|eliminar|borrar|add|remove|delete)\b/i,
  /\b(reordenar|reorganizar|reorder|reorganize)\b/i,
];

/**
 * Validates if user message is related to exam generation
 * Returns validation result with error message if invalid
 */
export function validateUserInput(
  messages: ChatMessage[],
  language: string = "es"
): ValidationResult {
  // Get last user message
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return { valid: true }; // No user message to validate
  }

  const content = lastUserMessage.content.trim();

  // Empty message
  if (!content) {
    return {
      valid: false,
      errorCode: "EMPTY_MESSAGE",
      error:
        language === "en"
          ? "Please provide a message to generate exam questions."
          : "Por favor proporciona un mensaje para generar preguntas de examen.",
    };
  }

  // Check if message is too short and generic
  if (content.length < 10 && !hasExamKeywords(content)) {
    return {
      valid: false,
      errorCode: "TOO_GENERIC",
      error:
        language === "en"
          ? "I'm here to help you create exam questions. Please describe what kind of questions you'd like to generate."
          : "Estoy aquí para ayudarte a crear preguntas de examen. Por favor describe qué tipo de preguntas te gustaría generar.",
    };
  }

  // Check for off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(content)) {
      return {
        valid: false,
        errorCode: "OFF_TOPIC",
        error:
          language === "en"
            ? "I can only help you create exam questions. Please describe what questions you'd like to generate (topic, difficulty, question type, etc.)."
            : "Solo puedo ayudarte a crear preguntas de examen. Por favor describe qué preguntas te gustaría generar (tema, dificultad, tipo de pregunta, etc.).",
      };
    }
  }

  // If message has exam-related keywords, allow it
  if (hasExamKeywords(content)) {
    return { valid: true };
  }

  // If message is longer and doesn't match off-topic patterns,
  // but also doesn't have exam keywords, warn user
  if (content.length >= 15) {
    // Be more lenient with longer messages - they might be describing a topic
    // But still check if they seem completely unrelated
    const seemsUnrelated =
      !content.match(/\b(sobre|about|acerca de|tema|topic|materia|subject|crear|create|generar|generate)\b/i) &&
      content.match(/\b(cuanto|cuánto|how much|what is|cual|cuál|which|quien|quién|who|donde|dónde|where)\b/i);

    if (seemsUnrelated) {
      return {
        valid: false,
        errorCode: "UNCLEAR_INTENT",
        error:
          language === "en"
            ? "I'm designed specifically to help you create exam questions. Please tell me what subject or topic you want to create questions about."
            : "Estoy diseñado específicamente para ayudarte a crear preguntas de examen. Por favor dime sobre qué tema o materia quieres crear preguntas.",
      };
    }
  }

  return { valid: true };
}

/**
 * Helper: Check if content has exam-related keywords
 */
function hasExamKeywords(content: string): boolean {
  return EXAM_RELATED_KEYWORDS.some((pattern) => pattern.test(content));
}
