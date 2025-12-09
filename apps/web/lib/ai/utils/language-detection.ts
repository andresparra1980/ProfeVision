/**
 * Language Detection Utilities
 *
 * Provides intelligent language detection for AI exam generation based on:
 * - Exam type keywords (TOEFL, Selectividad, etc.)
 * - Message text analysis (accents, common words)
 *
 * @see GitHub Issue #40
 */

/**
 * Exam type keywords that hint at specific languages
 */
const EXAM_HINTS = {
  en: [
    // English proficiency tests
    'toefl', 'ielts', 'cambridge', 'cae', 'cpe', 'fce', 'pet', 'ket',
    'toeic', 'bulats', 'oet', 'pte',
    // US standardized tests
    'sat', 'act', 'gre', 'gmat', 'lsat', 'mcat',
    // UK qualifications
    'a-level', 'a level', 'gcse', 'igcse',
    // General English indicators
    'english test', 'english exam', 'english proficiency',
  ],
  es: [
    'selectividad', 'ebau', 'evau', 'pau', 'bachillerato',
    'prueba de acceso', 'examen de español', 'lengua española',
    'prueba selectividad', 'examen bachillerato',
  ]
} as const;

/**
 * Detects language from exam type keywords in user message
 *
 * @param message - User's message text
 * @returns 'es' | 'en' | null - Detected language or null if inconclusive
 *
 * @example
 * detectLanguageFromMessage("Generate TOEFL questions") // => "en"
 * detectLanguageFromMessage("Crea examen de Selectividad") // => "es"
 * detectLanguageFromMessage("Generate 5 questions") // => null
 */
export function detectLanguageFromMessage(message: string): 'es' | 'en' | null {
  const lowerMsg = message.toLowerCase();

  // Check English exam type hints
  for (const keyword of EXAM_HINTS.en) {
    if (lowerMsg.includes(keyword)) {
      return 'en';
    }
  }

  // Check Spanish exam type hints
  for (const keyword of EXAM_HINTS.es) {
    if (lowerMsg.includes(keyword)) {
      return 'es';
    }
  }

  return null; // No exam type hints found
}

/**
 * Spanish-specific character indicators
 */
const SPANISH_INDICATORS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'] as const;

/**
 * Common Spanish words for language detection
 */
const SPANISH_WORDS = [
  'qué', 'cómo', 'cuántos', 'cuántas', 'genera', 'crea', 'sobre',
  'preguntas', 'examen', 'prueba', 'hacer', 'crear', 'generar',
] as const;

/**
 * Common English words for language detection
 */
const ENGLISH_WORDS = [
  'what', 'how', 'many', 'generate', 'create', 'about',
  'questions', 'exam', 'test', 'make',
] as const;

/**
 * Detects message language using heuristic analysis
 *
 * Analyzes:
 * - Spanish-specific characters (ñ, accents, ¿, ¡)
 * - Common word frequency in Spanish vs English
 *
 * @param message - User's message text
 * @returns 'es' | 'en' | null - Detected language or null if inconclusive
 *
 * @example
 * detectMessageLanguage("¿Cuántas preguntas?") // => "es"
 * detectMessageLanguage("How many questions?") // => "en"
 * detectMessageLanguage("5 questions") // => null (too short/inconclusive)
 */
export function detectMessageLanguage(message: string): 'es' | 'en' | null {
  const lowerMsg = message.toLowerCase();

  // Check for Spanish-specific characters (strong signal)
  for (const char of SPANISH_INDICATORS) {
    if (message.includes(char)) {
      return 'es';
    }
  }

  // Count word matches
  const spanishMatches = SPANISH_WORDS.filter(word => lowerMsg.includes(word)).length;
  const englishMatches = ENGLISH_WORDS.filter(word => lowerMsg.includes(word)).length;

  // Require at least 2-word advantage to avoid false positives
  if (spanishMatches > englishMatches + 1) {
    return 'es';
  }

  if (englishMatches > spanishMatches + 1) {
    return 'en';
  }

  return null; // Inconclusive
}
