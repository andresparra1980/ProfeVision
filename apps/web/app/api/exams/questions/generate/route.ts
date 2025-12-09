import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import logger from "@/lib/utils/logger";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4";
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const schema = z.object({
  tema: z.string().min(2),
  dificultad: z.enum(["básico", "intermedio", "avanzado"]),
  numOpciones: z.number().min(2).max(4),
  instrucciones: z.string().min(5),
  estilo: z.enum(["formal", "informal", "caso clínico"]).optional(),
  seccionPlan: z.string().min(10),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // 2. Get user from Supabase
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }
    // 3. (Opcional) Validar que el usuario sea profesor
    const { data: profesor } = await supabase
      .from("profesores")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profesor) {
      return NextResponse.json(
        { error: "Solo los profesores pueden generar preguntas" },
        { status: 403 }
      );
    }
    // 4. Validar y sanear payload
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      tema,
      dificultad,
      numOpciones,
      instrucciones,
      estilo,
      seccionPlan,
    } = parsed.data;
    // 5. Build prompt
    let prompt = `Genera UNA pregunta de opción múltiple (única respuesta) para el tema '${tema}', dificultad '${dificultad}'.\n`;
    prompt += `Instrucciones del profesor: ${instrucciones}\n`;
    prompt += `Usa la siguiente sección del plan de estudios como contexto: '${seccionPlan}'.\n`;
    if (estilo) {
      prompt += `El estilo debe ser '${estilo}'.\n`;
    }
    prompt += `Debe incluir ${numOpciones} opciones, numeradas, una de ellas correcta. Devuélvelo en JSON con estructura: { pregunta: string, opciones: [ { texto: string, esCorrecta: boolean } ] }`;
    logger.log("Prompt enviado a OpenRouter:", prompt);
    // 6. Call OpenRouter.ai
    if (!OPENROUTER_API_KEY) {
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
          {
            role: "system",
            content:
              "Eres un generador de preguntas de opción múltiple para exámenes académicos.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });
    if (!aiRes.ok) {
      logger.error("Error OpenRouter", await aiRes.text());
      return NextResponse.json(
        { error: "Error al generar pregunta con IA" },
        { status: 500 }
      );
    }
    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    logger.log("Respuesta bruta de OpenRouter:", content);
    if (!content) {
      return NextResponse.json(
        { error: "Respuesta vacía de IA" },
        { status: 500 }
      );
    }
    // 7. Parse JSON from AI response
    let parsedJson;
    try {
      // Extraer JSON del string si viene envuelto
      const match = content.match(/\{[\s\S]*\}/);
      parsedJson = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch (_e) {
      logger.error("Error parseando JSON IA", content);
      return NextResponse.json(
        { error: "Error parseando respuesta de IA", raw: content },
        { status: 500 }
      );
    }
    // 8. Formatear respuesta final
    const pregunta = {
      id: undefined,
      texto: parsedJson.pregunta,
      tipo: "opcion_multiple",
      puntaje: 1,
      opciones: Array.isArray(parsedJson.opciones)
        ? parsedJson.opciones.map(
            (op: { texto: string; esCorrecta: boolean }, idx: number) => ({
              id: `opcion-${idx + 1}`,
              texto: op.texto,
              esCorrecta: !!op.esCorrecta,
            })
          )
        : [],
    };
    return NextResponse.json(pregunta);
  } catch (error) {
    logger.error("Error en generación IA", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
