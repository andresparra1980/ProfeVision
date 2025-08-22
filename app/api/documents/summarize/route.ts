import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { createOpenAI } from "@ai-sdk/openai";
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
    const { text, options } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
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
      } catch (e) {
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
