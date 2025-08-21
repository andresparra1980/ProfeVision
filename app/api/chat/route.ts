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

// Zod: request schema per DOC_preguntas_ia.md
const ChatMessageSchema = z.object({
  role: z.enum(["user", "system", "assistant"]),
  content: z.string().min(1),
});

const ChatContextSchema = z.object({
  documentId: z.string().nullable().optional(),
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
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  context: ChatContextSchema,
});

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

function buildSystemPrompt(language: string) {
  return [
    // Contexto y rol
    "Eres un experto en creación de exámenes educativos. Tu función es generar preguntas de alta calidad.",
    "Devuelves exclusivamente JSON válido, sin comentarios ni explicaciones externas.",

    // Reglas importantes
    "REGLAS IMPORTANTES:",
    "1) Solo usa los tipos permitidos por el contrato (multiple_choice, true_false, short_answer, essay) según lo indicado en el contexto.",
    "2) En preguntas multiple_choice, debe haber entre 2 y 4 opciones y exactamente UNA respuesta correcta.",
    "3) Las opciones incorrectas deben ser plausibles pero claramente incorrectas.",
    "4) El JSON debe cumplir EXACTAMENTE con el contrato indicado (estructura con clave raíz 'exam' y arreglo 'questions').",
    "5) Las preguntas deben ser claras, precisas y educativamente válidas.",

    // Comportamiento crítico
    "COMPORTAMIENTO CRÍTICO:",
    "- Si recibes un examen existente en el contexto, SIEMPRE devuelve el examen COMPLETO actualizado bajo la clave 'exam'.",
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

    // Recordatorio del contrato (se define explícitamente en otro mensaje del sistema)
    "Responde exclusivamente con JSON válido que cumpla el contrato indicado a continuación.",
  ].join("\n");
}

function buildUserInstruction(context: z.infer<typeof ChatContextSchema>) {
  const { language, numQuestions, questionTypes, difficulty, taxonomy } =
    context;
  const constraints: string[] = [];
  if (questionTypes.includes("multiple_choice")) {
    constraints.push(
      "Para 'multiple_choice': crea entre 2 y 4 opciones y exactamente UNA correcta."
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

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        models,
        messages: [
          { role: "system", content: systemPrompt },
          // Conversación previa del usuario
          ...messages,
          // Instrucción final con parámetros estructurados
          { role: "user", content: userInstruction },
          // Pista de contrato explícita
          {
            role: "system",
            content:
              'CONTRATO ESTRUCTURA (responde SOLO con JSON válido): { "exam": { "title": string, "subject": string, "level": string, "language": string, "questions": [ { "id": string, "type": "multiple_choice|true_false|short_answer|essay", "prompt": string, "options": [string], "answer": string|number|boolean|array, "rationale": string, "difficulty": "easy|medium|hard", "taxonomy": "remember|understand|apply|analyze|evaluate|create"|string[], "tags": [string], "source": { "documentId": string|null, "spans": [ { "start": number, "end": number } ] } } ] } }\n\nREGLAS ADICIONALES DEL CONTRATO:\n- Si \'type\' == \'multiple_choice\', \'options\' debe tener entre 2 y 4 elementos y \'answer\' debe corresponder a UNA única opción correcta.\n- Si \'type\' == \'true_false\', \'answer\' debe ser boolean.\n- Usa ids secuenciales: q1, q2, q3... en el campo \'id\'.\n- Devuelve SIEMPRE el examen completo bajo la clave \'exam\'.',
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      logger.error("Error OpenRouter", txt);
      return NextResponse.json(
        { error: "Error al generar contenido con IA" },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const content: string | undefined = aiData.choices?.[0]?.message?.content;
    logger.log("Respuesta IA bruta recibida");

    if (!content) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 502 }
      );
    }

    // 6) Extraer JSON y validar (tolerante a bloques con ```json ... ```)
    let jsonPayload: unknown;
    try {
      const stripped = content
        .trim()
        // quita cabecera de bloque de código: ```json\n o ```\n
        .replace(/^```[a-zA-Z]*\n?/, "")
        // quita cierre de bloque de código: ``` al final
        .replace(/```$/, "")
        .trim();

      // Intento directo
      try {
        jsonPayload = JSON.parse(stripped);
      } catch {
        // Extrae el objeto JSON más externo si hay texto adicional
        const start = stripped.indexOf("{");
        const end = stripped.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonPayload = JSON.parse(stripped.slice(start, end + 1));
        } else {
          throw new Error("No JSON object found");
        }
      }
    } catch (_e) {
      logger.error("No se pudo parsear JSON de IA", content);
      return NextResponse.json(
        { error: "JSON inválido devuelto por IA", raw: content },
        { status: 422 }
      );
    }

    const validated = ExamSchema.safeParse(jsonPayload);
    if (!validated.success) {
      logger.warn("Contrato inválido de IA", validated.error.flatten());
      return NextResponse.json(
        {
          error: "Contrato inválido de IA",
          details: validated.error.flatten(),
          raw: jsonPayload,
        },
        { status: 422 }
      );
    }

    // 7) Normalizar IDs de preguntas para que sean secuenciales (q1..qN) según el orden
    const data = validated.data;
    const normalized = {
      exam: {
        ...data.exam,
        questions: data.exam.questions.map((q, idx) => ({ ...q, id: `q${idx + 1}` })),
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
