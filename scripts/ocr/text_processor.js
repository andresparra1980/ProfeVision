const fs = require("fs");
const fsp = require("fs").promises; // fs.promises
const path = require("path");
const mammoth = require("mammoth");
require("dotenv").config({ path: ".env.local" });

// Configuración de OpenRouter

// Depuración de variables de entorno
console.log("Verificando variables de entorno:");
console.log(
  "OPENROUTER_API_KEY:",
  process.env.OPENROUTER_API_KEY ? "*** (presente)" : "No encontrada"
);
console.log("OPENAI_MODEL:", process.env.OPENAI_MODEL || "No encontrada");
console.log(
  "OPENAI_FALBACK_MODEL:",
  process.env.OPENAI_FALBACK_MODEL || "No encontrada"
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.OPENAI_MODEL || process.env.OPENAI_FALBACK_MODEL;

// Función para procesar el texto con OpenRouter
async function processWithAI(text) {
  try {
    const prompt = `Analiza el siguiente texto de examen y extrae las preguntas con sus opciones de respuesta.
    
    INSTRUCCIONES IMPORTANTES:
    1. Identifica cada pregunta y sus opciones de respuesta (a, b, c, d, etc.)
    2. Si una opción está claramente marcada como correcta (con un asterisco al final del texto de la respuesta), indícalo en 'respuesta_correcta'
    3. No analices el texto de las preguntas para identificar la respuesta correcta, solo analiza si alguna opcion esta marcada con el asterisco. Si no esta marcada ninguna, establece 'respuesta_correcta' como null.
    4. Devuelve SOLO un objeto JSON válido con el siguiente formato exacto:
    
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
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Extractor de Preguntas",
        "X-API-Key": OPENROUTER_API_KEY,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que ayuda a extraer preguntas de exámenes médicos y sus opciones de respuesta en formato JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

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

    // Asegurarse de que el resultado tenga el formato esperado
    let preguntas = [];

    if (result.preguntas && Array.isArray(result.preguntas)) {
      preguntas = result.preguntas;
    } else if (Array.isArray(result)) {
      preguntas = result;
    } else {
      preguntas = [result];
    }

    // Normalizar el formato de las preguntas
    return preguntas.map((pregunta, index) => ({
      numero: pregunta.numero || index + 1,
      pregunta: cleanText(pregunta.pregunta || ""),
      opciones: {
        a: cleanText(pregunta.opciones?.a || ""),
        b: cleanText(pregunta.opciones?.b || ""),
        c: cleanText(pregunta.opciones?.c || ""),
        d: cleanText(pregunta.opciones?.d || ""),
      },
      respuesta_correcta: pregunta.respuesta_correcta || null,
    }));
  } catch (error) {
    console.error("Error al procesar con OpenRouter:", error);
    throw error;
  }
}

// Función para limpiar el texto
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim();
}

// Función para asegurar que el directorio de salida exista
async function ensureOutputDir() {
  try {
    await fsp.mkdir(path.join(__dirname, "output"), { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      console.error("Error al crear el directorio de salida:", err);
      throw err;
    }
  }
}

// Función para guardar el resultado en un archivo JSON
async function saveResult(questions, originalPath) {
  try {
    // Asegurar que el directorio de salida existe
    await ensureOutputDir();

    // Crear la ruta de salida en la carpeta output
    const fileName = path.basename(originalPath).replace(/\.\w+$/, ".json");
    const resultPath = path.join(__dirname, "output", fileName);

    // Crear el objeto de resultado con el formato deseado
    const resultado = {
      total_preguntas: questions.length,
      preguntas: questions.map((q) => ({
        numero: q.numero,
        pregunta: q.pregunta,
        opciones: q.opciones,
        respuesta_correcta: q.respuesta_correcta,
      })),
    };

    // Guardar el archivo JSON con formato
    await fsp.writeFile(resultPath, JSON.stringify(resultado, null, 2));
    console.log(`\n✅ Resultado guardado en: ${resultPath}`);

    // Mostrar estadísticas
    console.log(`\n📊 Estadísticas:`);
    console.log(`- Total de preguntas: ${questions.length}`);

    // Contar respuestas correctas
    const respuestasCorrectas = questions.filter(
      (q) => q.respuesta_correcta
    ).length;
    console.log(`- Respuestas correctas identificadas: ${respuestasCorrectas}`);

    if (questions.length > 0) {
      console.log("\n🔍 Primera pregunta procesada:");
      console.log(JSON.stringify(questions[0], null, 2));
    }
  } catch (error) {
    console.error("Error al guardar el resultado:", error);
    throw error;
  }
}

// Función para extraer preguntas del documento
async function extractQuestionsFromDocx(docxPath) {
  try {
    // Extraer el texto usando mammoth
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    // Normalizar saltos de línea
    const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Procesar el texto con OpenAI
    console.log("\nProcesando preguntas con inteligencia artificial...");
    const questions = await processWithAI(normalizedText);

    // Asegurar que todas las preguntas tengan el formato correcto
    return questions.map((q, index) => ({
      numero: q.numero || index + 1,
      pregunta: q.pregunta || "",
      opciones: q.opciones || null,
      respuesta_correcta: q.respuesta_correcta || null,
    }));
  } catch (error) {
    console.error("Error al extraer preguntas:", error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    // Verificar que se proporcione un archivo
    if (process.argv.length < 3) {
      console.error("Por favor, proporcione la ruta al archivo DOCX");
      process.exit(1);
    }

    const docxPath = process.argv[2];

    // Verificar que el archivo existe
    if (!fs.existsSync(docxPath)) {
      console.error(`Error: El archivo '${docxPath}' no existe.`);
      process.exit(1);
    }

    console.log(`Procesando archivo: ${path.basename(docxPath)}`);

    // Extraer preguntas del documento
    console.log("\nExtrayendo preguntas del documento...");
    const questions = await extractQuestionsFromDocx(docxPath);

    // Guardar el resultado en un archivo JSON
    await saveResult(questions, docxPath);
  } catch (error) {
    console.error("Error en el proceso principal:", error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
