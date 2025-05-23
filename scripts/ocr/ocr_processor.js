const fs = require("fs").promises;
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.OPENAI_MODEL || "google/gemini-2.0-flash-lite-001";

// Función para codificar un archivo PDF a base64
async function encodeFileToBase64(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString("base64");
    return `data:application/pdf;base64,${base64Data}`;
  } catch (error) {
    console.error("Error al leer el archivo:", error);
    throw error;
  }
}

// Función para asegurar que el directorio de salida exista
async function ensureOutputDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'output'), { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error al crear el directorio de salida:', err);
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
    const fileName = path.basename(originalPath).replace(/\.\w+$/, '.ocr.json');
    const resultPath = path.join(__dirname, 'output', fileName);
    
    // Crear el objeto de resultado con el formato deseado
    const resultado = {
      total_preguntas: questions.length,
      preguntas: questions
    };

    // Guardar el archivo JSON con formato
    await fs.writeFile(resultPath, JSON.stringify(resultado, null, 2));
    console.log(`\n✅ Resultado guardado en: ${resultPath}`);

    // Mostrar estadísticas
    console.log(`\n📊 Estadísticas:`);
    console.log(`- Total de preguntas: ${questions.length}`);

    // Contar respuestas correctas
    const respuestasCorrectas = questions.filter(q => q.respuesta_correcta).length;
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

// Función para analizar el archivo y extraer preguntas y respuestas
async function processFile(filePath) {
  try {
    console.log(`\nProcesando archivo: ${path.basename(filePath)}`);

    // Codificar el archivo a base64 con el MIME type correcto
    const base64File = await encodeFileToBase64(filePath);

    console.log("Enviando documento para análisis...");

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Extractor de Preguntas PDF",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `Eres un asistente que ayuda a extraer preguntas de exámenes academicos y sus opciones de respuesta en formato JSON. 
                        Tu tarea es identificar las preguntas, todas sus opciones y marcar cuál es la respuesta correcta que está claramente marcada o resaltada en el documento.
                        
                        IMPORTANTE:
                        1. Si el documento adjunto está vacío o no contiene preguntas, devuelve un array vacío: []
                        2. No inventes preguntas ni respuestas que no estén en el documento
                        3. Si la respuesta correcta no está claramente marcada, establece "respuesta_correcta" como null
                        4. Si la respuesta correcta está claramente marcada, establece "razon" como la razón por la que crees que es la respuesta correcta (porque se veai marcado o por otra razon?)
                        
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
                                "respuesta_correcta": "letra" | null,
                                "razon": "razón decidiste que es la respuesta correcta (porque se veai marcado o por otra razon?)"
                            },
                            ...
                        ]`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Extrae todas las preguntas y sus opciones de este examen. Para cada pregunta, identifica cuál es la opción que está claramente marcada como correcta (resaltada, subrayada, en negrita, etc.). Si ninguna opción está marcada claramente como correcta, establece "respuesta_correcta" como null.',
              },
              {
                type: "file",
                file: {
                  filename: path.basename(filePath),
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
              engine: "native", // Usar OCR para manejar documentos escaneados
            },
          },
        ],
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
    let result = JSON.parse(jsonString);

    // Asegurarse de que el resultado sea un array
    if (result.preguntas && Array.isArray(result.preguntas)) {
      return result.preguntas;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return [result];
    }
  } catch (error) {
    console.error("Error al procesar el PDF:", error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    // Verificar que se proporcione un archivo
    if (process.argv.length < 3) {
      console.error("Por favor, proporcione la ruta al archivo PDF");
      process.exit(1);
    }

    const filePath = process.argv[2];
    const ext = path.extname(filePath).toLowerCase();

    // Verificar que sea un archivo PDF
    if (ext !== ".pdf") {
      console.error("Error: El archivo debe ser un PDF");
      process.exit(1);
    }

    // Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      console.error(`Error: El archivo '${filePath}' no existe.`);
      process.exit(1);
    }

    console.log(`Procesando archivo: ${path.basename(filePath)}`);
    console.log("\nExtrayendo preguntas del documento PDF...");

    // Procesar el archivo PDF
    const questions = await processFile(filePath);

    // Guardar el resultado en un archivo JSON
    await saveResult(questions, filePath);
  } catch (error) {
    console.error("Error en el proceso principal:", error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
