import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import logger from "@/lib/utils/logger";
import { cleanText } from "@/lib/document-processor/cleanText";

// Env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "google/gemini-2.5-flash-lite";
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = "force-dynamic";

// Request schema per DOC_summary_documentos.md
const SelectionSpanSchema = z.object({ start: z.number().int().min(0), end: z.number().int().min(0) });
const SummaryRequestSchema = z
  .object({
    documentId: z.string().optional(),
    text: z.string().optional(),
    language: z.string().min(2).default("es"),
    granularity: z.enum(["global", "section", "selection"]).default("global"),
    targetLength: z.enum(["short", "medium", "long"]).default("medium"),
    selectionSpans: z.array(SelectionSpanSchema).optional().default([]),
  })
  .refine((val) => Boolean(val.documentId || val.text), {
    message: "Se requiere documentId o text",
    path: ["documentId"],
  });

// Response contract schema per DOC_summary_documentos.md
const SummarySchema = z.object({
  summary: z.object({
    documentId: z.string().nullable(),
    language: z.string(),
    granularity: z.enum(["global", "section", "selection"]),
    targetLength: z.enum(["short", "medium", "long"]),
    content: z.string(),
    bullets: z.array(z.string()).default([]),
    coverage: z.object({
      sections: z
        .array(
          z.object({
            title: z.string(),
            spans: z.array(z.object({ start: z.number(), end: z.number() })),
          })
        )
        .default([]),
      percentage: z.number().min(0).max(100).default(100),
    }),
  }),
});

function buildSystemPrompt(language: string) {
  return [
    "Eres un asistente que resume documentos de forma fiel y concisa.",
    "Devuelves exclusivamente JSON válido sin comentarios ni explicaciones.",
    `Idioma de salida obligatorio: ${language}.`,
    "Incluye: un párrafo principal en 'content' y bullets clave en 'bullets'.",
    "Si falta contexto para un resumen fiel, indícalo explícitamente.",
  ].join(" ");
}

function buildUserInstruction(params: {
  granularity: "global" | "section" | "selection";
  targetLength: "short" | "medium" | "long";
}) {
  const { granularity, targetLength } = params;
  return [
    `Alcance: ${granularity}.`,
    `Longitud objetivo: ${targetLength}.`,
    "Responde solo con el objeto JSON del contrato 'summary'.",
  ].join(" ");
}

async function resolveDocumentText(documentId?: string): Promise<string | null> {
  // NOTE: No extractor endpoints available currently. Expecting 'text' in body.
  // For future: fetch extracted text by documentId from DB or storage.
  if (!documentId) return null;
  return null;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  logger.api("/api/summary:START");

  try {
    // 1) Auth via Supabase
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
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }
    // Only professors
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

    // 2) Validate payload
    const body = await req.json();
    const parsed = SummaryRequestSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Payload inválido", parsed.error.flatten());
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { documentId, text: rawText, language, granularity, targetLength, selectionSpans } = parsed.data;

    // 3) Resolve text
    let text: string | null = rawText ?? null;
    if (!text && documentId) {
      text = await resolveDocumentText(documentId);
      if (!text) {
        logger.warn("Documento no encontrado o sin texto", { documentId });
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
      }
    }

    if (!text) {
      return NextResponse.json({ error: "No se proporcionó texto" }, { status: 400 });
    }

    // 4) Preprocess and selection handling
    let processed = cleanText(text);

    // Apply selection if provided
    if (selectionSpans && selectionSpans.length > 0) {
      const len = processed.length;
      const parts: string[] = [];
      for (const span of selectionSpans) {
        const start = Math.max(0, Math.min(len, span.start));
        const end = Math.max(0, Math.min(len, span.end));
        if (end > start) {
          parts.push(processed.slice(start, end));
        }
      }
      if (parts.length === 0) {
        return NextResponse.json(
          { error: "Selección fuera de rango" },
          { status: 400 }
        );
      }
      processed = cleanText(parts.join("\n\n"));
    }

    const MAX_CHARS = 50000;
    if (processed.length > MAX_CHARS) {
      logger.warn("Texto demasiado largo, truncando", { original: processed.length, max: MAX_CHARS });
      processed = processed.slice(0, MAX_CHARS);
    }

        // 5) LLM call via OpenRouter (direct fetch)
    if (!OPENROUTER_API_KEY) {
      logger.error("Falta API Key de OpenRouter");
      return NextResponse.json(
        { error: "Falta API Key de OpenRouter" },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(language);
    const userInstruction = buildUserInstruction({ granularity, targetLength });

    const models = OPENAI_FALLBACK_MODEL
      ? [OPENAI_MODEL, OPENAI_FALLBACK_MODEL]
      : [OPENAI_MODEL];

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Optional headers for analytics/identification
        "HTTP-Referer": "https://www.profevision.com",
        "X-Title": "ProfeVision",
      },
      body: JSON.stringify({
        models,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              userInstruction,
              "Contrato esperado: { \"summary\": { \"documentId\": string|null, \"language\": string, \"granularity\": \"global|section|selection\", \"targetLength\": \"short|medium|long\", \"content\": string, \"bullets\": [string], \"coverage\": { \"sections\": [ { \"title\": string, \"spans\": [ { \"start\": number, \"end\": number } ] } ], \"percentage\": number } } }",
              `Documento texto (limpio, posiblemente truncado):\n\n${processed}`,
            ].join("\n\n"),
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      logger.error("Error OpenRouter /summary", txt);
      return NextResponse.json(
        { error: "Error al generar resumen con IA" },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const content: string | undefined = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 502 }
      );
    }

    // Extraer JSON del contenido (tolerante a ```json ... ```)
    let jsonPayload: unknown;
    try {
      const stripped = content
        .trim()
        .replace(/^```[a-zA-Z]*\n?/, "")
        .replace(/```$/, "")
        .trim();

      try {
        jsonPayload = JSON.parse(stripped);
      } catch {
        const start = stripped.indexOf("{");
        const end = stripped.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonPayload = JSON.parse(stripped.slice(start, end + 1));
        } else {
          throw new Error("No JSON object found");
        }
      }
    } catch (_e) {
      logger.error("No se pudo parsear JSON de IA (summary)", content);
      return NextResponse.json(
        { error: "JSON inválido devuelto por IA", raw: content },
        { status: 422 }
      );
    }

    // Validate again to be safe
    const validated = SummarySchema.safeParse(jsonPayload);
    if (!validated.success) {
      logger.warn("Contrato inválido de IA", validated.error.flatten());
      return NextResponse.json(
        { error: "Contrato inválido de IA", details: validated.error.flatten() },
        { status: 422 }
      );
    }

    // Enrich with request params
    const response = {
      summary: {
        ...validated.data.summary,
        documentId: documentId ?? validated.data.summary.documentId ?? null,
        language,
        granularity,
        targetLength,
      },
    };

    logger.perf("/api/summary:OK", { ms: Date.now() - t0 });
    return NextResponse.json(response);
  } catch (error) {
    logger.error("/api/summary:ERROR", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
