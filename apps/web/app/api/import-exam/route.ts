import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import logger from "@/lib/utils/logger";
import { getApiTranslator } from "@/i18n/api";
import {
  MAX_QUESTION_OPTIONS,
  MIN_QUESTION_OPTIONS,
  getImportedQuestionOptionCountIssues,
} from "@/lib/exams/question-option-validation";

// Interfaces
interface ImportedQuestion {
  numero: number;
  pregunta: string;
  opciones: {
    a: string;
    b: string;
    c?: string;
    d?: string;
    [key: string]: string | undefined;
  };
  respuesta_correcta: string | null;
  razon?: string;
}

interface ProcessResult {
  total_preguntas: number;
  preguntas: ImportedQuestion[];
}

type RawImportedQuestion = {
  numero?: number;
  pregunta?: string;
  opciones?: Record<string, string | undefined>;
  respuesta_correcta?: unknown;
  razon?: string;
};

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.OPENAI_MODEL || "google/gemini-2.0-flash-lite-001";

function interpolate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
}

// Función para limpiar asteriscos de las opciones
function cleanOptionsFromMarkers(preguntas: ImportedQuestion[]): ImportedQuestion[] {
  return preguntas.map(pregunta => ({
    ...pregunta,
    opciones: Object.entries(pregunta.opciones).reduce((acc, [key, value]) => {
      // Remover asteriscos solo al inicio o final (marcadores), no en el medio (ej: operaciones matemáticas)
      if (value) {
        // Remover asteriscos al inicio y final, preservando los del medio
        acc[key] = value.replace(/^\*+|\*+$/g, '').trim();
      }
      return acc;
    }, {} as typeof pregunta.opciones)
  }));
}

function normalizeCorrectKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const letter = normalized[0];
  return /^[a-z]$/.test(letter) ? letter : null;
}

function optionHasMarker(optionText: string | undefined): boolean {
  if (!optionText) return false;
  return /^\*+/.test(optionText.trim()) || /\*+$/.test(optionText.trim());
}

function sanitizeImportedQuestions(rawQuestions: unknown[]): ImportedQuestion[] {
  return rawQuestions.map((question, index) => {
    const raw = (question || {}) as RawImportedQuestion;
    const rawOptions = raw.opciones || {};
    const opciones: ImportedQuestion["opciones"] = {
      a: rawOptions.a || "",
      b: rawOptions.b || "",
      ...rawOptions,
    };
    const optionKeys = Object.keys(opciones).map((key) => key.toLowerCase());

    const markedKeys = optionKeys.filter((key) => optionHasMarker(opciones[key]));
    const llmCorrectKey = normalizeCorrectKey(raw.respuesta_correcta);
    const hasValidLlmKey = !!llmCorrectKey && optionKeys.includes(llmCorrectKey);

    let respuestaCorrecta: string | null = null;

    if (markedKeys.length === 1 && (!hasValidLlmKey || llmCorrectKey === markedKeys[0])) {
      respuestaCorrecta = markedKeys[0];
    } else if (markedKeys.length === 0 && hasValidLlmKey) {
      respuestaCorrecta = llmCorrectKey;
    }

    return {
      numero: raw.numero ?? index + 1,
      pregunta: raw.pregunta || "",
      opciones,
      respuesta_correcta: respuestaCorrecta,
      razon: raw.razon,
    };
  });
}

// Función para procesar PDFs con OpenRouter
async function processPDFWithAI(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ImportedQuestion[]> {
  try {
    // Convertir PDF a base64
    const base64Data = pdfBuffer.toString("base64");
    const base64File = `data:application/pdf;base64,${base64Data}`;

    logger.api("OpenRouter OCR - Inicio", {
      fileName,
      fileSize: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
      model: AI_MODEL,
    });
    logger.log("Enviando PDF para análisis con IA...");

    const startTime = performance.now();

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://profevision.com",
        "X-Title": "Extractor de Preguntas PDF",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `Eres un asistente que ayuda a extraer preguntas de exámenes académicos y sus opciones de respuesta en formato JSON. 
                      Tu tarea es identificar las preguntas, todas sus opciones y marcar cuál es la respuesta correcta que está claramente marcada o resaltada en el documento.
                      
                       IMPORTANTE:
                       1. Si el documento adjunto está vacío o no contiene preguntas, devuelve un array vacío: []
                       2. No inventes preguntas ni respuestas que no estén en el documento
                       3. Si la respuesta correcta no está claramente marcada, establece "respuesta_correcta" como null
                       4. Cada pregunta debe tener entre 2 y 4 opciones de respuesta, nunca menos ni más
                       5. Si detectas mas de una opcion marcada como correcta en la misma pregunta, establece "respuesta_correcta" como null
                       6. Si la respuesta correcta está claramente marcada.
                      
                      El formato de salida debe ser un array de objetos JSON con la siguiente estructura:
                      [
                          {
                              "numero": número de pregunta,
                              "pregunta": "texto de la pregunta",
                              "opciones": {
                                  "a": "texto opción a",
                                  "b": "texto opción b",
                                  ...
                              },
                              "respuesta_correcta": "letra" | null
                          },
                          ...
                      ]`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Extrae todas las preguntas y sus opciones de este examen. Para cada pregunta, identifica cuál es la opción que está claramente marcada como correcta (resaltada, subrayada, en negrita, con asterisco (*), etc.). IMPORTANTE: Incluye el asterisco en el texto de la opción si está presente, ya que será removido posteriormente. No tomes decisiones basadas en el texto de la pregunta, solo analiza si alguna opción está marcada visualmente. Si ninguna opción está marcada claramente como correcta, establece "respuesta_correcta" como null.',
              },
              {
                type: "file",
                file: {
                  filename: fileName,
                  file_data: base64File,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        plugins: [
          {
            id: "file-parser",
            pdf: {
              engine: "native",
            },
          },
        ],
      }),
    });

    const endTime = performance.now();
    logger.perf(
      "OpenRouter OCR - Tiempo de respuesta",
      `${(endTime - startTime).toFixed(2)}ms`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error en la API: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No se recibió respuesta de la API");
    }

    // Intentar extraer el JSON de la respuesta
    const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) ||
      responseContent.match(/```\n([\s\S]*?)\n```/) || [null, responseContent];

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonString);

    // Asegurarse de que el resultado sea un array
    let preguntas: unknown[] = [];

    if (result.preguntas && Array.isArray(result.preguntas)) {
      preguntas = result.preguntas;
    } else if (Array.isArray(result)) {
      preguntas = result;
    } else {
      preguntas = [result];
    }

    // Log del resultado final
    logger.api("OpenRouter OCR - Resultado final", {
      num_preguntas: preguntas.length,
      primer_pregunta: preguntas.length > 0 ? preguntas[0] : null,
    });

    // Normalizar respuesta correcta y limpiar asteriscos
    return cleanOptionsFromMarkers(sanitizeImportedQuestions(preguntas));
  } catch (error) {
    logger.error("OpenRouter OCR - Error crítico", error);
    console.error("Error al procesar PDF con IA:", error);
    throw error;
  }
}

// Función para procesar texto con OpenRouter
async function processTextWithAI(text: string): Promise<ImportedQuestion[]> {
  try {
    logger.api("OpenRouter Text - Inicio", {
      longitud_texto: text.length,
      primeros_caracteres: text.substring(0, 100) + "...",
      modelo: AI_MODEL,
    });

    const startTime = performance.now();
    const prompt = `Analiza el siguiente texto de examen y extrae las preguntas con sus opciones de respuesta.
    
    INSTRUCCIONES IMPORTANTES:
    1. Identifica cada pregunta y sus opciones de respuesta (a, b, c, d, etc.)
    2. Si una opción está claramente marcada como correcta (con un asterisco * al inicio o final del texto de la respuesta), indícalo en 'respuesta_correcta' e INCLUYE el asterisco en el texto de la opción
    3. No analices el texto de las preguntas para identificar la respuesta correcta, solo analiza si alguna opción está marcada con asterisco. Si no está marcada ninguna, establece 'respuesta_correcta' como null
    4. Los asteriscos serán removidos automáticamente después, así que DEBES incluirlos en el texto de las opciones si están presentes
    5. Cada pregunta debe tener entre 2 y 4 opciones de respuesta, nunca menos ni más
    6. Si detectas mas de una opcion marcada como correcta en la misma pregunta, establece 'respuesta_correcta' como null
    7. Devuelve SOLO un objeto JSON válido con el siguiente formato exacto:
    
    {
      "preguntas": [
        {
          "numero": 1,
          "pregunta": "Texto de la pregunta",
          "opciones": {
            "a": "Opción A",
            "b": "Opción B",
            "c": "Opción C",
            "d": "Opción D"
          },
          "respuesta_correcta": "a"  // o "b", "c", "d", o null si no hay respuesta marcada
        }
      ]
    }
    
    TEXTO DEL EXAMEN:
    ${text}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://profevision.com",
        "X-Title": "Extractor de Preguntas",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que ayuda a extraer preguntas de exámenes académicos y sus opciones de respuesta en formato JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const endTime = performance.now();
    logger.perf(
      "OpenRouter Text - Tiempo de respuesta",
      `${(endTime - startTime).toFixed(2)}ms`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error en la API: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No se recibió respuesta de la API");
    }

    // Parsear la respuesta JSON
    const result = JSON.parse(responseContent);

    let preguntas: unknown[] = [];

    if (result.preguntas && Array.isArray(result.preguntas)) {
      preguntas = result.preguntas;
    } else if (Array.isArray(result)) {
      preguntas = result;
    }

    logger.api("OpenRouter Text - Resultado final", {
      num_preguntas: preguntas.length,
    });

    // Normalizar respuesta correcta y limpiar asteriscos
    return cleanOptionsFromMarkers(sanitizeImportedQuestions(preguntas));
  } catch (error) {
    logger.error("OpenRouter Text - Error crítico", error);
    console.error("Error al procesar texto con IA:", error);
    throw error;
  }
}

// Función para procesar archivos DOC/DOCX
async function processDOCX(buffer: Buffer): Promise<ImportedQuestion[]> {
  try {
    logger.log("Extrayendo texto de documento DOCX...");
    console.log("Extrayendo texto de documento DOCX...");

    // Usar mammoth para extraer texto del DOCX
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      throw new Error("No se pudo extraer texto del documento");
    }

    console.log("Texto extraído, procesando con IA...");

    // Procesar el texto extraído con IA
    return await processTextWithAI(text);
  } catch (error) {
    logger.error("DOCX - Error de procesamiento", error);
    console.error("Error al procesar archivo DOCX:", error);
    throw error;
  }
}

// Función para procesar archivos PDF
async function processPDF(
  buffer: Buffer,
  fileName: string
): Promise<ImportedQuestion[]> {
  try {
    logger.log("Procesando archivo PDF...");
    console.log("Procesando archivo PDF...");

    // Usar procesamiento directo con IA
    return await processPDFWithAI(buffer, fileName);
  } catch (error) {
    logger.error("PDF - Error de procesamiento", error);
    console.error("Error al procesar archivo PDF:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const { t } = await getApiTranslator(request, "import-exam");

  try {
    logger.api("Import Exam - Inicio de solicitud", { url: request.url });
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { message: t("errors.missingApiKey", "OpenRouter API key is not configured") },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: t("errors.missingFile", "No file provided") },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: t("errors.unsupportedFile", "Unsupported file type. Use PDF, DOC or DOCX.") },
        { status: 400 }
      );
    }

    // Validar tamaño (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: t("errors.fileTooLarge", "The file is too large. Maximum 10MB.") },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let preguntas: ImportedQuestion[] = [];

    // Procesar según el tipo de archivo
    if (file.type === "application/pdf") {
      preguntas = await processPDF(buffer, file.name);
    } else {
      // DOC o DOCX
      preguntas = await processDOCX(buffer);
    }

    // Crear el resultado final
    const invalidQuestions = getImportedQuestionOptionCountIssues(preguntas);
    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        {
          message: interpolate(
            t(
              "errors.invalidOptionCount",
              `Each question must have between ${MIN_QUESTION_OPTIONS} and ${MAX_QUESTION_OPTIONS} answer options.`
            ),
            { min: MIN_QUESTION_OPTIONS, max: MAX_QUESTION_OPTIONS }
          ),
          invalidQuestions: invalidQuestions.map((question) => ({
            numero: question.index + 1,
            optionCount: question.optionCount,
            message: interpolate(
              t(
                "errors.invalidOptionCountQuestion",
                `Question ${question.index + 1} has ${question.optionCount} answer options. It must have between ${MIN_QUESTION_OPTIONS} and ${MAX_QUESTION_OPTIONS}.`
              ),
              {
                question: question.index + 1,
                count: question.optionCount,
                min: MIN_QUESTION_OPTIONS,
                max: MAX_QUESTION_OPTIONS,
              }
            ),
          })),
        },
        { status: 400 }
      );
    }

    const result: ProcessResult = {
      total_preguntas: preguntas.length,
      preguntas: preguntas,
    };

    logger.api("Import Exam - Procesamiento completado", {
      total_preguntas: preguntas.length,
      tipo_archivo: file.type,
    });

    console.log(
      `✅ Procesamiento completado: ${preguntas.length} preguntas extraídas`
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Import Exam - Error general", error);
    console.error("Error general en import-exam:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: `${t("errors.processingFile", "Error processing file")}: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: t("errors.internal", "Internal server error") },
      { status: 500 }
    );
  }
}
