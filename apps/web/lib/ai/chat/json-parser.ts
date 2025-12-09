import logger from "@/lib/utils/logger";

/**
 * Sanitizes AI exam payload for compatibility with contract
 * - Converts difficulty: "mixed" -> "medium"
 * - Converts numeric answer indices to option text for multiple_choice
 */
export function sanitizeAIExamPayload(obj: unknown): unknown {
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
        if (
          qType === "multiple_choice" &&
          typeof qAnswer === "number" &&
          Array.isArray(qOptions)
        ) {
          const idx = Math.floor(qAnswer);
          if (
            idx >= 0 &&
            idx < qOptions.length &&
            typeof qOptions[idx] === "string"
          ) {
            (q as Record<string, unknown>).answer = qOptions[idx];
            logger.warn(
              `Repaired numeric answer index ${idx} to option text for question ${(q as Record<string, unknown>).id}`
            );
          }
        }
      }
    }
    return cloned;
  } catch {
    return obj;
  }
}

/**
 * Parses AI response content into JSON payload
 * Handles multiple formats: arrays, objects, strings with code fences, etc.
 */
export function parseAIResponse(contentUnknownFinal: unknown): unknown {
  let jsonPayload: unknown;

  if (Array.isArray(contentUnknownFinal)) {
    // Algunos modelos devuelven "content" como una lista de partes
    // Buscamos primero un objeto, si no, un string con JSON
    let found: unknown | undefined;
    for (const part of contentUnknownFinal) {
      if (part && typeof part === "object") {
        // OpenAI-style: { type: 'output_text', text: '...' }
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string") {
          try {
            found = JSON.parse(text);
            break;
          } catch {
            /* continue */
          }
        }
        // Or the part could already be the object
        if (!found) {
          found = part;
        }
      } else if (typeof part === "string") {
        try {
          found = JSON.parse(part);
          break;
        } catch {
          /* continue */
        }
      }
    }
    if (found == null) {
      logger.error("No se pudo extraer JSON desde arreglo de partes de IA");
      throw new Error("JSON_PARSE_ARRAY_FAILED");
    }
    jsonPayload = found;
  } else if (typeof contentUnknownFinal === "object") {
    // Algunos modelos pueden devolver ya un objeto JSON en message.content o wrappers
    const obj = contentUnknownFinal as Record<string, unknown>;
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
          .replace(/,(\s*[}\]])/g, "$1");
        jsonPayload = JSON.parse(normalizedText);
      }
    } else if (obj && typeof obj.content === "object" && obj.content != null) {
      jsonPayload = obj.content as unknown;
    } else {
      jsonPayload = obj;
    }
  } else if (typeof contentUnknownFinal === "string") {
    // Minimal, robust strategy: direct parse; detect truncation; minimally repair backslashes inside strings
    const stripCodeFences = (s: string) =>
      s
        .trim()
        .replace(/^```(?:json|jsonc|javascript|js|ts|typescript)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    const normalizeWeirdUnicode = (s: string) =>
      s.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[\u2028\u2029]/g, "");
    const isBalancedBraces = (s: string) => {
      let inStr = false,
        esc = false,
        depth = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
          if (esc) esc = false;
          else if (ch === "\\") esc = true;
          else if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') {
          inStr = true;
          continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
      return depth === 0;
    };
    const repairInvalidBackslashesInStrings = (s: string) => {
      let out = "";
      let inStr = false,
        esc = false;
      const isValidEscape = (c: string) =>
        c === '"' ||
        c === "\\" ||
        c === "/" ||
        c === "b" ||
        c === "f" ||
        c === "n" ||
        c === "r" ||
        c === "t" ||
        c === "u";
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
          if (esc) {
            out += ch;
            esc = false;
            continue;
          }
          if (ch === "\\") {
            const next = s[i + 1] ?? "";
            if (!isValidEscape(next)) {
              // insert an extra backslash to make it a valid escape sequence
              out += "\\";
            }
            out += ch; // original backslash
            continue;
          }
          if (ch === '"') {
            inStr = false;
            out += ch;
            continue;
          }
          out += ch;
          continue;
        }
        if (ch === '"') {
          inStr = true;
          out += ch;
          continue;
        }
        out += ch;
      }
      return out;
    };
    try {
      const raw = normalizeWeirdUnicode(contentUnknownFinal);
      // 1) Try direct parse
      try {
        jsonPayload = JSON.parse(raw);
        logger.api("/api/chat:JSON parsed", {
          method: "direct",
          size: raw.length,
        });
      } catch {
        // 2) Strip fences and try again
        const stripped = stripCodeFences(raw);
        // 2a) If looks like object but braces are unbalanced -> treat as truncation
        if (stripped.trim().startsWith("{") && !isBalancedBraces(stripped)) {
          logger.error("AI devolvió JSON truncado", { len: stripped.length });
          throw new Error("JSON_TRUNCATED");
        }
        // 2b) Try parse stripped
        try {
          jsonPayload = JSON.parse(stripped);
          logger.api("/api/chat:JSON parsed", {
            method: "stripped",
            size: stripped.length,
          });
        } catch {
          // 3) Minimal repair: escape invalid backslashes inside strings and try again
          const repaired = repairInvalidBackslashesInStrings(stripped);
          try {
            jsonPayload = JSON.parse(repaired);
            logger.api("/api/chat:JSON parsed", {
              method: "repaired",
              size: repaired.length,
            });
          } catch {
            throw new Error("PARSE_FAILED");
          }
        }
      }
    } catch (e) {
      logger.error("No se pudo parsear JSON de IA", {
        type: typeof contentUnknownFinal,
        size: String(contentUnknownFinal).length,
        error: String(e),
      });
      throw e;
    }
  } else {
    logger.error(
      "Contenido de IA con tipo inesperado",
      typeof contentUnknownFinal
    );
    throw new Error("UNSUPPORTED_CONTENT_TYPE");
  }

  // Si vino un arreglo en la raíz, intenta encontrar el objeto con clave 'exam'
  if (Array.isArray(jsonPayload)) {
    const arr = jsonPayload as unknown[];
    const withExam = arr.find(
      (x) =>
        x && typeof x === "object" && "exam" in (x as Record<string, unknown>)
    );
    jsonPayload = withExam ?? arr[0];
  }

  return jsonPayload;
}
