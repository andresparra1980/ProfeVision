import { ChatContext, ChatMessage } from "./schemas";

/**
 * Builds the system prompt for the AI exam generation
 */
export function buildSystemPrompt(language: string): string {
  return [
    // Contexto y rol
    "Eres un experto en creación de exámenes educativos. Tu función es generar preguntas de alta calidad.",
    "IMPORTANTE: SOLO puedes ayudar con la creación, modificación y gestión de preguntas de examen. NO respondas preguntas de conocimiento general, matemáticas básicas, consultas personales, médicas, o cualquier tema fuera del contexto de generación de exámenes.",
    "Si un usuario intenta hacerte preguntas no relacionadas con la creación de exámenes, responde educadamente redirigiendo al propósito: 'Solo puedo ayudarte a crear preguntas de examen. Por favor describe qué preguntas te gustaría generar.'",
    "Devuelves exclusivamente JSON válido, sin comentarios ni explicaciones externas.",
    "PROHIBIDO usar Markdown o fences de código. Responde SOLO con JSON plano.",
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
    "PROHIBIDO usar backticks (`) para código inline. Los backticks no son válidos en LaTeX. Escribe código o comandos como texto plano sin formato especial.",
    "IMPORTANTE: la respuesta debe ser un único objeto JSON. No devuelvas arrays sueltos ni envolturas adicionales.",
    "IMPORTANTE: Escribe los comandos LaTeX con UNA sola barra invertida por comando (\\alpha, \\Delta, \\frac, etc.). No insertes barras extra; el escape necesario del JSON se aplica automáticamente.",
    "Ejemplos correctos en strings JSON: '$\\\\Delta p$', '$E=mc^2$', '\\\\[ \\int_0^1 x^2 \\; dx \\\\]'. Evita escribir 'Deltap' o 'LaTeX en texto plano'.",

    // Recordatorio del contrato (se define explícitamente en otro mensaje del sistema)
    "Responde exclusivamente con JSON válido que cumpla el contrato indicado a continuación.",
  ].join("\n");
}

/**
 * Builds user instruction based on context parameters
 */
export function buildUserInstruction(context: ChatContext): string {
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

/**
 * Builds the complete messages array for LangChain
 */
export function buildLLMMessages(
  context: ChatContext,
  messages: ChatMessage[],
  systemPrompt: string,
  userInstruction: string
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  return [
    { role: "system" as const, content: systemPrompt },
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
    { role: "system" as const, content: userInstruction },
    // Pista de contrato explícita
    {
      role: "system" as const,
      content:
        'CONTRATO ESTRUCTURA (responde SOLO con JSON válido): { "exam": { "title": string, "subject": string, "level": string, "language": string, "questions": [ { "id": string, "type": "multiple_choice|true_false|short_answer|essay", "prompt": string, "options": [string], "answer": string|number|boolean|array, "rationale": string, "difficulty": "easy|medium|hard", "taxonomy": "remember|understand|apply|analyze|evaluate|create"|string[], "tags": [string], "source": { "documentId": string|null, "spans": [ { "start": number, "end": number } ] } } ] } }\n\nREGLAS ADICIONALES DEL CONTRATO:\n- Si \'type\' == \'multiple_choice\', \'options\' debe tener entre 2 y 4 elementos y \'answer\' debe ser el TEXTO COMPLETO de la opción correcta (string), NUNCA un número índice.\n- Si \'type\' == \'true_false\', \'answer\' debe ser boolean.\n- Usa ids secuenciales: q1, q2, q3... en el campo \'id\'.\n- Si una pregunta u opción incluye fórmulas/expresiones, represéntalas en LaTeX (inline con $...$, display con \\[...\\]) dentro del string correspondiente.\n- Devuelve SIEMPRE el examen completo bajo la clave \'exam\'.',
    },
  ];
}
