import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import logger from "@/lib/utils/logger";

// Env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite";
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Zod: response contract schema per DOC_preguntas_ia.md
const ExamQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "essay"]),
  prompt: z.string(),
  options: z.array(z.string()).optional().default([]),
  answer: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.any())])
    .nullable(),
  rationale: z.string().optional().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  taxonomy: z
    .union([
      z.enum([
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ]),
      z.array(
        z.enum([
          "remember",
          "understand",
          "apply",
          "analyze",
          "evaluate",
          "create",
        ])
      ),
    ])
    .optional()
    .default("understand"),
  tags: z.array(z.string()).optional().default([]),
  source: z
    .object({
      documentId: z.string().nullable(),
      spans: z.array(z.object({ start: z.number(), end: z.number() })),
    })
    .optional()
    .default({ documentId: null, spans: [] }),
});

const ExamSchema = z.object({
  exam: z.object({
    title: z.string(),
    subject: z.string(),
    level: z.string(),
    language: z.string(),
    questions: z.array(ExamQuestionSchema).min(1),
  }),
});

// Zod: request schema per DOC_preguntas_ia.md
const ChatMessageSchema = z.object({
  role: z.enum(["user", "system", "assistant"]),
  content: z.string().min(1),
});

// Optional topic summary context to guide question generation
const TopicSummarySchema = z.object({
  generalOverview: z.string(),
  academicLevel: z.string(),
  macroTopics: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        importance: z.enum(["high", "medium", "low"]),
        microTopics: z
          .array(
            z.object({
              name: z.string(),
              description: z.string(),
              keyTerms: z.array(z.string()),
              concepts: z.array(z.string()),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

const ChatContextSchema = z.object({
  documentIds: z.array(z.string()).max(5).optional().default([]),
  language: z.string().min(2).default("es"),
  numQuestions: z.number().int().min(1).max(50).optional(),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "short_answer", "essay"]))
    .nonempty(),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  taxonomy: z
    .array(
      z.enum([
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ])
    )
    .optional()
    .default([]),
  // Multiple optional summaries from background processing
  topicSummaries: z
    .array(z.object({ documentId: z.string(), summary: TopicSummarySchema }))
    .optional()
    .default([]),
  // Optional existing exam (the UI may allow edits locally and send as baseline for the next turn)
  existingExam: ExamSchema.nullable().optional(),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  context: ChatContextSchema,
});

function buildSystemPrompt(language: string) {
  return [
    // Contexto y rol
    "Eres un experto en creación de exámenes educativos. Tu función es generar preguntas de alta calidad.",
    "Devuelves exclusivamente JSON válido, sin comentarios ni explicaciones externas.",
    "PROHIBIDO usar Markdown o fences de código (no uses ``` ni ```json). Responde SOLO con JSON plano.",
    "No agregues texto antes o después del JSON (ni notas, ni 'Aquí tienes', ni bloques de ejemplo).",

    // Reglas importantes
    "REGLAS IMPORTANTES:",
    "1) Solo usa los tipos permitidos por el contrato (multiple_choice, true_false, short_answer, essay) según lo indicado en el contexto.",
    "2) En preguntas multiple_choice, debe haber entre 2 y 4 opciones y exactamente UNA respuesta correcta.",
    "3) CRÍTICO: Para 'multiple_choice', el campo 'answer' debe ser el TEXTO COMPLETO de la opción correcta (string), NUNCA un índice numérico (0, 1, 2...). Copia exactamente el texto de la opción.",
    "4) Las opciones incorrectas deben ser plausibles pero claramente incorrectas.",
    "5) El JSON debe cumplir EXACTAMENTE con el contrato indicado (estructura con clave raíz 'exam' y arreglo 'questions').",
    "6) Las preguntas deben ser claras, precisas y educativamente válidas.",
    "7) Si algún enunciado u opción incluye fórmulas, ecuaciones, expresiones matemáticas, químicas o similares, REPRESENTA esas expresiones en LaTeX (no Markdown) usando delimitadores $...$ para inline y \\[...\\] para display; no agregues prosa fuera del JSON.",
    "8) No envuelvas la salida en bloques de código ni etiquetas de lenguaje (NO uses ```json).",

    // Comportamiento crítico
    "COMPORTAMIENTO CRÍTICO:",
    "- Asegúrate de que el JSON sea balanceado (abre y cierra correctamente las llaves y corchetes).",
    "- No reemplaces preguntas existentes por preguntas nuevas a menos que el usuario lo indique explícitamente cual.",
    "- Si recibes un examen existente en el contexto, SIEMPRE devuelve el examen COMPLETO actualizado bajo la clave 'exam' sin borrar preguntas a menos que el usuario lo indique explícitamente.",
    "- Mantén las preguntas no modificadas exactamente iguales.",
    "- Si agregas preguntas, añádelas al final; si reordenas, devuelve todas en el nuevo orden.",
    "- Numera las preguntas secuencialmente en el campo 'id' (por ejemplo: q1, q2, q3...) y asegúrate que el índice concuerde con el orden de las preguntas.",
    "- Tras eliminar o reordenar preguntas, reenumera consecutivamente desde q1 sin huecos (q1, q2, q3, ...).",
    "- NUNCA te refieras textualmente a material del contexto que el estudiante no verá; úsalo solo para comprender el tema.",
    "- NUNCA devuelvas solo preguntas modificadas: siempre el examen completo en la estructura especificada.",
    "- Si el usuario pide que borres preguntas, borra las preguntas correspondientes en el examen.",
    "- Si el usuario pide que agregues preguntas, agrega las preguntas correspondientes al examen.",
    "- Si el usuario pide que reordenes preguntas, reordena las preguntas correspondientes en el examen.",
    "- Si el usuario pide que modifiques preguntas, modifica las preguntas correspondientes en el examen.",
    "- Si existe examen previo y el usuario no especifica cantidad, ignora 'numQuestions' y actúa solo según la última petición del usuario (agregar/quitar/reordenar/modificar).",

    // Idioma
    `Idioma de salida obligatorio: ${language}.`,
    "Incluye racionales breves en cada pregunta en el campo 'rationale'.",
    "Usa LaTeX para las fórmulas cuando aplique (por ejemplo: \\int, \\frac{...}{...}, potencias con ^, funciones como \\sin, \\cos).",
    "Formato de fórmulas: inline con $...$ y display con \\[...\\]. No uses Markdown math (ni ``` ni bloques).",
    "IMPORTANTE: la respuesta debe ser un único objeto JSON. No devuelvas arrays sueltos ni envolturas adicionales.",
    "IMPORTANTE: Escribe los comandos LaTeX con UNA sola barra invertida por comando (\\alpha, \\Delta, \\frac, etc.). No insertes barras extra; el escape necesario del JSON se aplica automáticamente.",
    "Ejemplos correctos en strings JSON: '$\\\\Delta p$', '$E=mc^2$', '\\\\[ \\int_0^1 x^2 \\; dx \\\\]'. Evita escribir 'Deltap' o 'LaTeX en texto plano'.",

    // Recordatorio del contrato (se define explícitamente en otro mensaje del sistema)
    "Responde exclusivamente con JSON válido que cumpla el contrato indicado a continuación.",
  ].join("\n");
}

// Sanea payloads de IA para compatibilidad con el contrato (p.ej. difficulty: "mixed" -> "medium", numeric answer indices -> option text)
const sanitizeAIExamPayload = (obj: unknown): unknown => {
  try {
    if (!obj || typeof obj !== "object") return obj;
    const cloned: Record<string, unknown> = JSON.parse(JSON.stringify(obj));
    const exam = (
      cloned as { exam?: { questions?: Array<Record<string, unknown>> } }
    ).exam;
    const allowed = new Set(["easy", "medium", "hard"]);
    if (exam && Array.isArray(exam.questions)) {
      for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i];
        if (!q || typeof q !== "object") continue;
        
        // Sanitize difficulty
        const diff = (q as Record<string, unknown>).difficulty;
        if (typeof diff !== "string" || !allowed.has(diff)) {
          (q as Record<string, unknown>).difficulty = "medium";
        }
        
        // Sanitize numeric answer indices for multiple_choice questions
        const qType = (q as Record<string, unknown>).type;
        const qAnswer = (q as Record<string, unknown>).answer;
        const qOptions = (q as Record<string, unknown>).options;
        if (qType === "multiple_choice" && typeof qAnswer === "number" && Array.isArray(qOptions)) {
          const idx = Math.floor(qAnswer);
          if (idx >= 0 && idx < qOptions.length && typeof qOptions[idx] === "string") {
            (q as Record<string, unknown>).answer = qOptions[idx];
            logger.warn(`Repaired numeric answer index ${idx} to option text for question ${(q as Record<string, unknown>).id}`);
          }
        }
      }
    }
    return cloned;
  } catch {
    return obj;
  }
};

function buildUserInstruction(context: z.infer<typeof ChatContextSchema>) {
  const { language, numQuestions, questionTypes, difficulty, taxonomy } =
    context;
  const constraints: string[] = [];
  if (questionTypes.includes("multiple_choice")) {
    constraints.push(
      "Para 'multiple_choice': crea entre 2 y 4 opciones y exactamente UNA correcta. El campo 'answer' debe ser el texto completo de la opción correcta, NO un número índice. Ejemplo: si las opciones son ['A', 'B', 'C'], y B es correcta, 'answer' debe ser 'B', no 1."
    );
  }
  if (questionTypes.includes("true_false")) {
    constraints.push(
      "Para 'true_false': la respuesta debe ser booleana y el enunciado inequívoco."
    );
  }
  return [
    numQuestions != null
      ? `Genera exactamente ${numQuestions} preguntas en idioma ${language}.`
      : `No asumas cantidad de preguntas; sigue exactamente la cantidad indicada por el usuario en su último mensaje en idioma ${language}. Si no se indicó cantidad y existe un examen previo, mantén el número de preguntas y solo realiza las operaciones solicitadas (agregar/quitar/reordenar/modificar).`,
    `Tipos permitidos: ${questionTypes.join(", ")}.`,
    `Dificultad: ${difficulty}.`,
    taxonomy && taxonomy.length ? `Taxonomía: ${taxonomy.join(", ")}.` : "",
    constraints.join(" "),
    "Entrega el examen completo bajo la clave 'exam' y cumple estrictamente el contrato indicado.",
    "Si alguna pregunta u opción incluye fórmulas o expresiones matemáticas/químicas, represéntalas en LaTeX: inline con $...$ y display con \\[...\\]. No uses Markdown; todo debe ir en strings JSON.",
  ]
    .filter(Boolean)
    .join(" \n");
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  logger.api("/api/chat:START");

  try {
    // 1) Auth obligatoria via Supabase
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      logger.auth("Missing Authorization header");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Supabase config missing");
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 }
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      logger.auth("Usuario no autenticado", { userError: !!userError });
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }
    // Verificar profesor
    const { data: profesor } = await supabase
      .from("profesores")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profesor) {
      logger.auth("Usuario no es profesor", { userId: user.id });
      return NextResponse.json(
        { error: "Solo los profesores pueden usar este endpoint" },
        { status: 403 }
      );
    }

    // 2) Validar payload
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Payload inválido", parsed.error.flatten());
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { messages, context } = parsed.data;

    // 3) Límite de numQuestions ya validado por Zod (<=50)

    // 4) Preparar prompt
    const systemPrompt = buildSystemPrompt(context.language);
    const userInstruction = buildUserInstruction(context);

    // 5) Llamar OpenRouter
    if (!OPENROUTER_API_KEY) {
      logger.error("Falta API Key de OpenRouter");
      return NextResponse.json(
        { error: "Falta API Key de OpenRouter" },
        { status: 500 }
      );
    }

    const models = OPENAI_FALLBACK_MODEL
      ? [OPENAI_MODEL, OPENAI_FALLBACK_MODEL]
      : [OPENAI_MODEL];

    const requestBody = {
      models,
      messages: [
        { role: "system", content: systemPrompt },
        // Contexto opcional: Resúmenes temáticos por documento (si hay varios docs)
        ...(context.topicSummaries || []).map((ts) => ({
          role: "system" as const,
          content:
            `Resumen temático del documento (documentId: ${ts.documentId}). ` +
            `Úsalo SOLO como contexto para alinear los temas; no lo cites literalmente.\n` +
            `${JSON.stringify(ts.summary)}`,
        })),
        // Contexto opcional: examen existente a modificar/expandir
        ...(context.existingExam
          ? [
              {
                role: "system" as const,
                content:
                  "Examen existente provisto por el usuario. Si el usuario solicita cambios, devuelve el examen COMPLETO actualizado.\n" +
                  `${JSON.stringify(context.existingExam)}`,
              },
            ]
          : []),
        // Conversación previa del usuario
        ...messages,
        // Instrucción final con parámetros estructurados
        { role: "user", content: userInstruction },
        // Pista de contrato explícita
        {
          role: "system",
          content:
            'CONTRATO ESTRUCTURA (responde SOLO con JSON válido): { "exam": { "title": string, "subject": string, "level": string, "language": string, "questions": [ { "id": string, "type": "multiple_choice|true_false|short_answer|essay", "prompt": string, "options": [string], "answer": string|number|boolean|array, "rationale": string, "difficulty": "easy|medium|hard", "taxonomy": "remember|understand|apply|analyze|evaluate|create"|string[], "tags": [string], "source": { "documentId": string|null, "spans": [ { "start": number, "end": number } ] } } ] } }\n\nREGLAS ADICIONALES DEL CONTRATO:\n- Si \'type\' == \'multiple_choice\', \'options\' debe tener entre 2 y 4 elementos y \'answer\' debe ser el TEXTO COMPLETO de la opción correcta (string), NUNCA un número índice.\n- Si \'type\' == \'true_false\', \'answer\' debe ser boolean.\n- Usa ids secuenciales: q1, q2, q3... en el campo \'id\'.\n- Si una pregunta u opción incluye fórmulas/expresiones, represéntalas en LaTeX (inline con $...$, display con \\[...\\]) dentro del string correspondiente.\n- Devuelve SIEMPRE el examen completo bajo la clave \'exam\'.',
        },
      ],
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    };

    // Log request to LLM in chunks (similar to response logging)
    try {
      const requestBodyStr = JSON.stringify(requestBody, null, 2);
      const size = requestBodyStr.length;
      const chunkSize = 8000;
      const total = Math.ceil(size / chunkSize) || 1;
      logger.api("/api/chat:LLM request", { models, messageCount: requestBody.messages.length, size });
      for (let i = 0; i < total; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, size);
        logger.api("/api/chat:LLM request chunk", { idx: i + 1, total, start, end, size, chunk: requestBodyStr.slice(start, end) });
      }
    } catch (_e) { void _e; }

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ProfeVision",
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      logger.error("Error OpenRouter", txt);
      return NextResponse.json(
        { error: "Error al generar contenido con IA" },
        { status: 502 }
      );
    }

    // Read raw body as text to log exact response from LLM
    const rawBody = await aiRes.text();
    try {
      const size = rawBody.length;
      const chunkSize = 8000;
      const total = Math.ceil(size / chunkSize) || 1;
      for (let i = 0; i < total; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, size);
        logger.api("/api/chat:LLM raw chunk", { idx: i + 1, total, start, end, size, chunk: rawBody.slice(start, end) });
      }
    } catch (_e) { void _e; }

    // Derive contentUnknown from parsed JSON if possible, otherwise use raw string
    let contentUnknown: unknown;
    try {
      const aiData = JSON.parse(rawBody) as { choices?: Array<{ message?: { content?: unknown } }> };
      contentUnknown = aiData?.choices?.[0]?.message?.content as unknown;
    } catch {
      contentUnknown = rawBody as unknown;
    }

    if (contentUnknown == null) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 502 }
      );
    }

    // 6) Extraer JSON y validar (tolerante a bloques con ```json ... ```)
    let jsonPayload: unknown;
    if (Array.isArray(contentUnknown)) {
      // Algunos modelos devuelven "content" como una lista de partes
      // Buscamos primero un objeto, si no, un string con JSON
      let found: unknown | undefined;
      for (const part of contentUnknown) {
        if (part && typeof part === "object") {
          // OpenAI-style: { type: 'output_text', text: '...' }
          const text = (part as { text?: unknown }).text;
          if (typeof text === "string") {
            try {
              found = JSON.parse(text);
              break;
            } catch { /* continue */ }
          }
          // Or the part could already be the object
          if (!found) {
            found = part;
          }
        } else if (typeof part === "string") {
          try {
            found = JSON.parse(part);
            break;
          } catch { /* continue */ }
        }
      }
      if (found == null) {
        logger.error("No se pudo extraer JSON desde arreglo de partes de IA");
        return NextResponse.json(
          { error: "JSON inválido devuelto por IA", raw: contentUnknown },
          { status: 422 }
        );
      }
      jsonPayload = found;
    } else if (typeof contentUnknown === "object") {
      // Algunos modelos pueden devolver ya un objeto JSON en message.content o wrappers
      const obj = contentUnknown as Record<string, unknown>;
      if (obj && typeof obj === "object" && "exam" in obj) {
        jsonPayload = obj;
      } else if (typeof obj.text === "string") {
        // Unwrap text field containing JSON
        try {
          jsonPayload = JSON.parse(obj.text);
        } catch {
          // Try normalized parsing
          const normalizedText = obj.text
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/,(\s*[}\]])/g, '$1');
          jsonPayload = JSON.parse(normalizedText);
        }
      } else if (obj && typeof obj.content === "object" && obj.content != null) {
        jsonPayload = obj.content as unknown;
      } else {
        jsonPayload = obj;
      }
    } else if (typeof contentUnknown === "string") {
      // Minimal, robust strategy: direct parse; detect truncation; minimally repair backslashes inside strings
      const stripCodeFences = (s: string) => s.trim().replace(/^```(?:json|jsonc|javascript|js|ts|typescript)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const normalizeWeirdUnicode = (s: string) => s.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[\u2028\u2029]/g, "");
      const isBalancedBraces = (s: string) => {
        let inStr = false, esc = false, depth = 0;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
            continue;
          }
          if (ch === '"') { inStr = true; continue; }
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        return depth === 0;
      };
      const repairInvalidBackslashesInStrings = (s: string) => {
        let out = "";
        let inStr = false, esc = false;
        const isValidEscape = (c: string) => c === '"' || c === '\\' || c === '/' || c === 'b' || c === 'f' || c === 'n' || c === 'r' || c === 't' || c === 'u';
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (inStr) {
            if (esc) {
              out += ch; esc = false; continue;
            }
            if (ch === '\\') {
              const next = s[i + 1] ?? '';
              if (!isValidEscape(next)) {
                // insert an extra backslash to make it a valid escape sequence
                out += '\\';
              }
              out += ch; // original backslash
              continue;
            }
            if (ch === '"') { inStr = false; out += ch; continue; }
            out += ch; continue;
          }
          if (ch === '"') { inStr = true; out += ch; continue; }
          out += ch;
        }
        return out;
      };
      try {
        const raw = normalizeWeirdUnicode(contentUnknown);
        try {
          const size = raw.length;
          const chunkSize = 8000;
          const total = Math.ceil(size / chunkSize) || 1;
          logger.api("/api/chat:content-string info", { rawLen: size });
          for (let i = 0; i < total; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, size);
            logger.api("/api/chat:content-string chunk", { idx: i + 1, total, start, end, size, chunk: raw.slice(start, end) });
          }
        } catch (_e) { void _e; }
        // 1) Try direct parse
        try {
          jsonPayload = JSON.parse(raw);
          try { logger.api("/api/chat:parse success", { path: "direct" }); } catch (_e) { void _e; }
        } catch {
          // 2) Strip fences and try again
          const stripped = stripCodeFences(raw);
          try {
            const size = stripped.length;
            const chunkSize = 8000;
            const total = Math.ceil(size / chunkSize) || 1;
            logger.api("/api/chat:content-string stripped", { strippedLen: size });
            for (let i = 0; i < total; i++) {
              const start = i * chunkSize;
              const end = Math.min(start + chunkSize, size);
              logger.api("/api/chat:content-string stripped chunk", { idx: i + 1, total, start, end, size, chunk: stripped.slice(start, end) });
            }
          } catch (_e) { void _e; }
          // 2a) If looks like object but braces are unbalanced -> treat as truncation
          if (stripped.trim().startsWith('{') && !isBalancedBraces(stripped)) {
            logger.error("AI devolvió JSON truncado (braces desbalanceados)", { len: stripped.length, head: stripped.slice(0, 200) });
            return NextResponse.json({ error: "La IA devolvió JSON incompleto (truncado). Intenta de nuevo." }, { status: 502 });
          }
          // 2b) Try parse stripped
          try {
            jsonPayload = JSON.parse(stripped);
            try { logger.api("/api/chat:parse success", { path: "stripped" }); } catch (_e) { void _e; }
          } catch {
            // 3) Minimal repair: escape invalid backslashes inside strings and try again
            const repaired = repairInvalidBackslashesInStrings(stripped);
            try {
              jsonPayload = JSON.parse(repaired);
              try { logger.api("/api/chat:parse success", { path: "repaired-backslashes" }); } catch (_e) { void _e; }
            } catch {
              throw new Error('PARSE_FAILED');
            }
          }
        }
      } catch (_e) {
        logger.error("No se pudo parsear JSON de IA", { type: typeof contentUnknown, preview: String(contentUnknown).slice(0, 500) });
        return NextResponse.json(
          { error: "JSON inválido devuelto por IA", raw: String(contentUnknown).slice(0, 2000) },
          { status: 422 }
        );
      }
    } else {
      logger.error("Contenido de IA con tipo inesperado", typeof contentUnknown);
      return NextResponse.json(
        { error: "Contenido no soportado devuelto por IA", raw: String(contentUnknown) },
        { status: 422 }
      );
    }

    // Si vino un arreglo en la raíz, intenta encontrar el objeto con clave 'exam'
    if (Array.isArray(jsonPayload)) {
      const arr = jsonPayload as unknown[];
      const withExam = arr.find((x) => x && typeof x === 'object' && 'exam' in (x as Record<string, unknown>));
      jsonPayload = withExam ?? arr[0];
    }

    jsonPayload = sanitizeAIExamPayload(jsonPayload);

    const validation = ExamSchema.safeParse(jsonPayload);
    if (!validation.success) {
      const details = validation.error.flatten();
      logger.warn("Contrato inválido de IA", details);
      return NextResponse.json(
        {
          error: "Contrato inválido de IA",
          details,
          raw: jsonPayload,
        },
        { status: 422 }
      );
    }

    // 7) Normalizar IDs de preguntas para que sean secuenciales (q1..qN) según el orden
    const data = validation.data;
    const normalized = {
      exam: {
        ...data.exam,
        questions: data.exam.questions.map((q, idx) => ({
          ...q,
          id: `q${idx + 1}`,
        })),
      },
    };

    logger.perf("/api/chat:OK", { ms: Date.now() - t0 });
    return NextResponse.json(normalized);
  } catch (error) {
    logger.error("/api/chat:ERROR", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
