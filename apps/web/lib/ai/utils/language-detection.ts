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
  ],
  fr: [
    'baccalauréat', 'bac', 'brevet', 'concours', 'épreuve',
    'devoir surveillé', 'contrôle', 'delf', 'dalf', 'tcf',
    'examen français', 'test de français'
  ],
  pt: [
    'enem', 'vestibular', 'concurso', 'prova', 'simulado',
    'celpe-bras', 'avaliação', 'exame português', 'teste'
  ]
} as const;

/**
 * Detects language from exam type keywords in user message
 *
 * @param message - User's message text
 * @returns 'es' | 'en' | 'fr' | 'pt' | null - Detected language or null if inconclusive
 *
 * @example
 * detectLanguageFromMessage("Generate TOEFL questions") // => "en"
 * detectLanguageFromMessage("Crea examen de Selectividad") // => "es"
 * detectLanguageFromMessage("Generate 5 questions") // => null
 */
export function detectLanguageFromMessage(message: string): 'es' | 'en' | 'fr' | 'pt' | null {
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

  // Check French exam type hints
  for (const keyword of EXAM_HINTS.fr) {
    if (lowerMsg.includes(keyword)) {
      return 'fr';
    }
  }

  // Check Portuguese exam type hints
  for (const keyword of EXAM_HINTS.pt) {
    if (lowerMsg.includes(keyword)) {
      return 'pt';
    }
  }

  return null; // No exam type hints found
}

/**
 * Spanish-specific character indicators
 */
const SPANISH_INDICATORS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'] as const;

/**
 * French-specific character indicators
 */
const FRENCH_INDICATORS = ['ç', 'œ', 'æ', 'ê', 'î', 'ô', 'û', 'ë', 'ï', 'ù'] as const;

/**
 * Portuguese-specific character indicators
 */
const PORTUGUESE_INDICATORS = ['ã', 'õ'] as const;

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
 * Common French words for language detection
 */
const FRENCH_WORDS = [
  'quoi', 'comment', 'combien', 'générer', 'créer', 'sur',
  'questions', 'examen', 'faire', 'produire',
] as const;

/**
 * Common Portuguese words for language detection
 */
const PORTUGUESE_WORDS = [
  'como', 'quantas', 'gerar', 'criar', 'sobre',
  'questões', 'prova', 'fazer', 'produzir',
] as const;

/**
 * Detects message language using heuristic analysis
 *
 * Analyzes:
 * - Language-specific characters (accents, special chars)
 * - Common word frequency in each language
 *
 * @param message - User's message text
 * @returns 'es' | 'en' | 'fr' | 'pt' | null - Detected language or null if inconclusive
 *
 * @example
 * detectMessageLanguage("¿Cuántas preguntas?") // => "es"
 * detectMessageLanguage("How many questions?") // => "en"
 * detectMessageLanguage("Quelles questions ?") // => "fr"
 * detectMessageLanguage("Quantas questões?") // => "pt"
 */
export function detectMessageLanguage(message: string): 'es' | 'en' | 'fr' | 'pt' | null {
  const lowerMsg = message.toLowerCase();

  // Check for Spanish-specific characters (strong signal)
  for (const char of SPANISH_INDICATORS) {
    if (message.includes(char)) {
      return 'es';
    }
  }

  // Check for French-specific characters
  for (const char of FRENCH_INDICATORS) {
    if (message.includes(char)) {
      return 'fr';
    }
  }

  // Check for Portuguese-specific characters
  for (const char of PORTUGUESE_INDICATORS) {
    if (message.includes(char)) {
      return 'pt';
    }
  }

  // Count word matches for each language
  const spanishMatches = SPANISH_WORDS.filter(word => lowerMsg.includes(word)).length;
  const englishMatches = ENGLISH_WORDS.filter(word => lowerMsg.includes(word)).length;
  const frenchMatches = FRENCH_WORDS.filter(word => lowerMsg.includes(word)).length;
  const portugueseMatches = PORTUGUESE_WORDS.filter(word => lowerMsg.includes(word)).length;

  // Find the language with the most matches
  const maxMatches = Math.max(spanishMatches, englishMatches, frenchMatches, portugueseMatches);

  // Need at least 2 matches and a 2-word lead over the second best
  if (maxMatches < 2) {
    return null;
  }

  const matches: Record<string, number> = {
    es: spanishMatches,
    en: englishMatches,
    fr: frenchMatches,
    pt: portugueseMatches
  };

  // Sort by matches descending
  const sorted = Object.entries(matches).sort((a, b) => b[1] - a[1]);

  // Check if top language has at least 2 more than second
  if (sorted[0][1] >= sorted[1][1] + 2) {
    return sorted[0][0] as 'es' | 'en' | 'fr' | 'pt';
  }

  return null; // Inconclusive
}
