import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { createOpenAI } from "@ai-sdk/openai";
import logger from "@/lib/utils/logger";
import { generateObject } from "ai";
import { z } from "zod";

// Simple JSON schema type for our summary
export interface TopicSummaryResult {
  generalOverview: string;
  academicLevel: string;
  macroTopics: Array<{
    name: string;
    description: string;
    importance: "high" | "medium" | "low";
    microTopics: Array<{
      name: string;
      description: string;
      keyTerms: string[];
      concepts: string[];
    }>;
  }>;
}

// Zod schema mirroring TopicSummaryResult
const microTopicSchema = z.object({
  name: z.string(),
  description: z.string(),
  keyTerms: z.array(z.string()),
  concepts: z.array(z.string()),
});

const macroTopicSchema = z.object({
  name: z.string(),
  description: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  microTopics: z.array(microTopicSchema).min(0),
});

const summarySchema = z.object({
  generalOverview: z.string(),
  academicLevel: z.string(),
  macroTopics: z.array(macroTopicSchema).min(0),
});

function buildPrompt(text: string) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string | undefined = body?.text;
    const imageData: string | undefined = body?.imageData || body?.options?.imageData;
    const options = body?.options || {};

    // Decide mode: image vs text
    const isImageMode = !!imageData && typeof imageData === "string";

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    if (isImageMode) {
      // Vision summarization path
      // Per request: use env-configured models directly; allow 'openrouter/auto' as fallback
      const envPrimary = process.env.OPENAI_IMAGE_SUMMARY_MODEL || "";
      const envFallback = process.env.OPENAI_IMAGE_SUMMARY_FALBACK_MODEL || "";
      const visionModel = envPrimary || "openrouter/auto";
      const visionFallback = envFallback || "openrouter/auto";
      const temperature = typeof options?.temperature === "number" ? options.temperature : 0.2;
      const maxOutputTokens = typeof options?.maxOutputTokens === "number" ? options.maxOutputTokens : 20000;

      const prompt = `Eres un asistente educativo. Analiza la(s) imagen(es) y produce un resumen temático en Español, estructurado para docentes.

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
- Sé conciso pero informativo.
`;

      // Validate supported image content types if data URL
      if (imageData.startsWith("data:")) {
        const m = imageData.match(/^data:([^;]+);base64,/i);
        const mime = m?.[1] || "";
        const supported = /^(image\/(png|jpe?g|webp|gif))$/i.test(mime);
        if (!supported) {
          logger.warn(
            "summarize: unsupported image mime for vision (expected png|jpg|jpeg|webp|gif)",
            { mime }
          );
        }
      }

      const truncate = (s: string, n = 120) => (s.length > n ? s.slice(0, n) + "…[truncated]" : s);

      const buildMessages = () => [
        { role: "system", content: `Eres un experto analista de contenido académico. Devuelve SOLO JSON válido con el SIGUIENTE ESQUEMA EXACTO y claves en inglés:
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
No añadas nada fuera del JSON.` },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            // OpenRouter expects the image in image_url.url (data URL or remote URL)
            { type: "image_url", image_url: { url: imageData } },
          ],
        } as any,
      ];

      const requestVision = async (modelName: string) => {
        const headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "ProfeVision",
        } as const;

        const bodyObj = {
          model: modelName,
          messages: buildMessages(),
          temperature,
          max_tokens: maxOutputTokens,
          response_format: { type: "json_object" },
        };

        // Log request with redacted auth and truncated image content
        try {
          const redactedHeaders = { ...headers, Authorization: "Bearer [REDACTED]" };
          // Prepare a shallow-inspected body where image data is truncated
          const loggedBody = JSON.parse(JSON.stringify(bodyObj));
          try {
            const userContent = loggedBody?.messages?.[1]?.content;
            if (Array.isArray(userContent)) {
              for (const part of userContent) {
                if (part?.type === "image_url" && part?.image_url?.url && typeof part.image_url.url === "string") {
                  part.image_url.url = truncate(part.image_url.url, 120);
                }
              }
            }
          } catch {}
          // Stringify body so it doesn't collapse to [Object]
          logger.api(
            "/api/documents/summarize vision request",
            {
              model: modelName,
              headers: redactedHeaders,
              body: JSON.stringify(loggedBody, null, 2),
            }
          );
        } catch {}

        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify(bodyObj),
        });

        // Capture full response for diagnostics
        const status = resp.status;
        const headersObj: Record<string, string> = {};
        try {
          Array.from(resp.headers.entries()).forEach(([k, v]) => {
            headersObj[k] = v;
          });
        } catch {}
        const rawBody = await resp.text();
        logger.api("/api/documents/summarize vision raw response", {
          status,
          headers: headersObj,
          body: truncate(rawBody, 20000),
        });

        let data: any = null;
        try {
          data = JSON.parse(rawBody);
        } catch {
          // leave data as null; will be handled below
        }
        if (!resp.ok || !data) {
          logger.error("summarize vision non-OK", {
            status,
            headers: headersObj,
            details: truncate(rawBody, 20000),
          });
          const err: any = new Error(`OpenRouter vision ${status}: ${truncate(rawBody, 2000)}`);
          err.code = "TRANSPORT_ERROR";
          throw err;
        }
        const content: any = data?.choices?.[0]?.message?.content;
        if (!content) {
          const err = new Error("Empty content");
          (err as any).code = "PARSE_ERROR";
          throw err;
        }
        let contentText: string;
        if (typeof content === "string") contentText = content;
        else if (Array.isArray(content)) {
          // Join any text parts if provider returns content as an array of parts
          contentText = content
            .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
            .filter(Boolean)
            .join("\n");
        } else {
          const err = new Error("Unsupported content shape");
          (err as any).code = "PARSE_ERROR";
          throw err;
        }
        let jsonObj: unknown;
        try {
          jsonObj = JSON.parse(contentText);
        } catch {
          const match = contentText.match(/\{[\s\S]*\}/);
          if (match) jsonObj = JSON.parse(match[0]);
          else {
            const err = new Error("Model did not return JSON content");
            (err as any).code = "PARSE_ERROR";
            throw err;
          }
        }
        const validated = summarySchema.safeParse(jsonObj);
        if (!validated.success) {
          const err = new Error("Response failed schema validation: " + validated.error.message);
          (err as any).code = "VALIDATION_ERROR";
          // Attach a preview of parsed JSON for diagnostics
          (err as any).parsed = (() => {
            try { return JSON.stringify(jsonObj).slice(0, 2000); } catch { return undefined; }
          })();
          throw err;
        }
        // Log the parsed and validated JSON for diagnosis
        try {
          logger.api("/api/documents/summarize vision validated json", {
            result: JSON.stringify(validated.data, null, 2),
          });
        } catch {}
        return validated.data;
      };

      try {
        logger.api("/api/documents/summarize image-mode selected model", { model: envPrimary });
        const out = await requestVision(envPrimary);
        return NextResponse.json(out);
      } catch (_e1: any) {
        // Do not fallback if it's a parse/validation issue; surface to client for diagnosis
        if (_e1?.code === "VALIDATION_ERROR" || _e1?.code === "PARSE_ERROR") {
          logger.warn("summarize image-mode primary returned parse/validation issue; skipping fallback", {
            code: _e1?.code,
            message: String(_e1?.message || _e1),
            parsedPreview: _e1?.parsed,
          });
          return NextResponse.json(
            { error: _e1?.message || "Unprocessable LLM response", code: _e1?.code || "UNPROCESSABLE" },
            { status: 422 }
          );
        }
        if (_e1?.code !== "TRANSPORT_ERROR") {
          // Unknown/non-transport error -> surface without fallback
          logger.warn("summarize image-mode primary error; not a transport error, skipping fallback", {
            code: _e1?.code,
            message: String(_e1?.message || _e1),
          });
          return NextResponse.json(
            { error: _e1?.message || "Unprocessable LLM response", code: _e1?.code || "UNPROCESSABLE" },
            { status: 422 }
          );
        }
        logger.api("/api/documents/summarize image-mode fallback model", {
          model: envFallback,
          reason: "TRANSPORT_ERROR from primary",
          error: String(_e1?.message || _e1),
        });
        const out = await requestVision(envFallback);
        return NextResponse.json(out);
      }
    }

    // Text summarization path
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    // Cap text length to keep token usage reasonable
    const maxChars = (options?.maxChars as number) || 20000;
    const trimmed = text.length > maxChars ? text.slice(0, maxChars) : text;

    const model = options?.model || process.env.OPENAI_MODEL || "openrouter/auto";
    const temperature = typeof options?.temperature === "number" ? options.temperature : 0.3;
    const maxOutputTokens =
      typeof options?.maxOutputTokens === "number"
        ? options.maxOutputTokens
        : typeof options?.maxTokens === "number"
          ? options.maxTokens
          : 2200;

    // Prepare prompt
    const prompt = buildPrompt(trimmed);

    // OpenRouter client for Vercel AI SDK
    const openrouter = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        // Recommended by OpenRouter to improve request handling
        Accept: "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ProfeVision",
      },
    });

    // Helper fallback using OpenRouter chat/completions directly
    const requestViaChatCompletions = async (targetModel: string) => {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "ProfeVision",
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: "You are an expert academic content analyzer. Return STRICT JSON ONLY." },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxOutputTokens,
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const details = await resp.text();
        throw new Error(`OpenRouter chat/completions ${resp.status}: ${details}`);
      }
      const raw = await resp.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("/api/documents/summarize OpenRouter non-JSON body:", raw.slice(0, 500));
        throw new Error("OpenRouter returned non-JSON body");
      }
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Empty completion content from OpenRouter");
      }
      let jsonObj: any;
      try {
        jsonObj = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) jsonObj = JSON.parse(match[0]);
        else throw new Error("Model did not return JSON content");
      }
      const validated = summarySchema.safeParse(jsonObj);
      if (!validated.success) {
        throw new Error("Response failed schema validation: " + validated.error.message);
      }
      return validated.data;
    };

    // Generate schema-validated object preferring chat/completions on OpenRouter
    let parsedResponse: any;
    try {
      parsedResponse = await requestViaChatCompletions(model);
    } catch (err: any) {
      console.warn("/api/documents/summarize chat/completions attempt failed, retrying with generateObject", err?.message || err);
      try {
        const { object } = await generateObject({
          model: openrouter(model),
          prompt,
          temperature,
          maxOutputTokens,
          schema: summarySchema,
          schemaName: "TopicSummary",
        });
        parsedResponse = object;
      } catch (err2: any) {
        console.warn("/api/documents/summarize generateObject attempt failed, retrying with openrouter/auto", err2?.message || err2);
        const fallbackModel = "openrouter/auto";
        try {
          const { object } = await generateObject({
            model: openrouter(fallbackModel),
            prompt,
            temperature,
            maxOutputTokens,
            schema: summarySchema,
            schemaName: "TopicSummary",
          });
          parsedResponse = object;
        } catch (err3: any) {
          console.warn("/api/documents/summarize final fallback to chat/completions", err3?.message || err3);
          parsedResponse = await requestViaChatCompletions(fallbackModel);
        }
      }
    }

    // Basic shape check (defensive)
    if (
      !parsedResponse?.generalOverview ||
      !parsedResponse?.academicLevel ||
      !Array.isArray(parsedResponse?.macroTopics)
    ) {
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (e: any) {
    console.error("/api/documents/summarize error", e?.message || e, e?.stack || "");
    return NextResponse.json({ error: "Internal error", details: e?.message || String(e) }, { status: 500 });
  }
}
