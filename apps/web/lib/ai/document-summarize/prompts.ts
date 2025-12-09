/**
 * Build prompt for text-based summarization
 */
export function buildTextPrompt(text: string): string {
  return `You are an expert academic content analyzer. Read the following document content and produce a structured topic summary in Spanish for educators. Return STRICT JSON ONLY matching this exact schema:
{
  "generalOverview": string,
  "academicLevel": string, // e.g., "Primaria", "Secundaria", "Universidad"
  "macroTopics": [
    {
      "name": string,
      "description": string,
      "importance": "high" | "medium" | "low",
      "microTopics": [
        {
          "name": string,
          "description": string,
          "keyTerms": string[],
          "concepts": string[]
        }
      ]
    }
  ]
}
Rules:
- Output must be VALID JSON with no extra commentary.
- Be concise but informative.
- If content is short, macroTopics may be empty.

Document content (truncated if long):\n\n${text}`;
}

/**
 * Build system prompt for vision-based summarization
 */
export function buildVisionSystemPrompt(): string {
  return `Eres un experto analista de contenido académico. Devuelve SOLO JSON válido con el SIGUIENTE ESQUEMA EXACTO y claves en inglés:
{
  "generalOverview": string,
  "academicLevel": string,
  "macroTopics": [
    {
      "name": string,
      "description": string,
      "importance": "high" | "medium" | "low",
      "microTopics": [
        { "name": string, "description": string, "keyTerms": string[], "concepts": string[] }
      ]
    }
  ]
}
No añadas nada fuera del JSON.`;
}

/**
 * Build user prompt for vision-based summarization
 */
export function buildVisionUserPrompt(): string {
  return `Eres un asistente educativo. Analiza la(s) imagen(es) y produce un resumen temático en Español, estructurado para docentes.

Debes devolver EXCLUSIVAMENTE JSON VÁLIDO con las SIGUIENTES CLAVES y ESTRUCTURA EXACTAS (sin texto adicional):
{
  "generalOverview": string,
  "academicLevel": string, // p.ej.: "Primaria", "Secundaria", "Universidad"
  "macroTopics": [
    {
      "name": string,
      "description": string,
      "importance": "high" | "medium" | "low",
      "microTopics": [
        {
          "name": string,
          "description": string,
          "keyTerms": string[],
          "concepts": string[]
        }
      ]
    }
  ]
}

Reglas:
- Usa EXACTAMENTE estos nombres de propiedades en inglés: generalOverview, academicLevel, macroTopics, name, description, importance, microTopics, keyTerms, concepts.
- No incluyas comentarios, ni Markdown, ni texto fuera del JSON.
- Sé conciso pero informativo.`;
}

/**
 * Build messages for vision API
 */
export function buildVisionMessages(imageData: string): Array<{
  role: "system" | "user";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}> {
  return [
    { role: "system", content: buildVisionSystemPrompt() },
    {
      role: "user",
      content: [
        { type: "text", text: buildVisionUserPrompt() },
        { type: "image_url", image_url: { url: imageData } },
      ],
    },
  ];
}
