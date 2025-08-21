// Utilities to convert AI-generated exam JSON into internal structures used by ProfeVision
// This does NOT persist to DB. It prepares data for the creation flow.

export type AIQuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";

export interface AIExamQuestion {
  id: string;
  type: AIQuestionType;
  prompt: string;
  options?: string[];
  answer: string | number | boolean | unknown[] | null;
  rationale?: string;
  difficulty?: "easy" | "medium" | "hard";
  taxonomy?:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create"
    | Array<
        | "remember"
        | "understand"
        | "apply"
        | "analyze"
        | "evaluate"
        | "create"
      >;
  tags?: string[];
  source?: {
    documentId: string | null;
    spans: { start: number; end: number }[];
  };
}

export interface AIExamPayload {
  exam: {
    title: string;
    subject: string;
    level: string;
    language: string;
    questions: AIExamQuestion[];
  };
}

// Internal structures (frontend-side) compatible with DB schema semantics
export type InternalTipoPregunta =
  | "opcion_multiple"
  | "verdadero_falso"
  | "seleccion_multiple"
  | "respuesta_corta"
  | "ensayo";

export interface InternalOpcionRespuesta {
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface InternalPregunta {
  texto: string; // prompt
  tipo_id: InternalTipoPregunta;
  puntaje?: number; // optional defaulting to 1 in flows that need it
  orden: number;
  habilitada: boolean;
  opciones_respuesta?: InternalOpcionRespuesta[];
  metadatos?: {
    ai_id?: string;
    rationale?: string;
    difficulty?: "easy" | "medium" | "hard";
    taxonomy?: string | string[];
    tags?: string[];
    source?: AIExamQuestion["source"];
  };
}

export interface InternalExamen {
  titulo: string;
  descripcion?: string;
  materia?: string;
  nivel?: string;
  idioma?: string;
  preguntas: InternalPregunta[];
}

function mapType(aiType: AIQuestionType): InternalTipoPregunta {
  switch (aiType) {
    case "multiple_choice":
      return "opcion_multiple";
    case "true_false":
      return "verdadero_falso";
    case "short_answer":
      return "respuesta_corta";
    case "essay":
      return "ensayo";
    default:
      return "opcion_multiple";
  }
}

export function fromAIExamToInternal(payload: AIExamPayload): InternalExamen {
  const { exam } = payload;
  const preguntas: InternalPregunta[] = (exam.questions || []).map((q, idx) => {
    const tipo = mapType(q.type);

    // Build opciones for multiple choice and true/false, else empty
    let opciones: InternalOpcionRespuesta[] | undefined;
    if (tipo === "opcion_multiple") {
      const opts = Array.isArray(q.options) ? q.options : [];
      const normalizeAnswers = (): Array<string | number | boolean> => {
        if (q.answer == null) return [];
        if (Array.isArray(q.answer)) {
          return (q.answer as unknown[]).filter(
            (v): v is string | number | boolean =>
              typeof v === "string" || typeof v === "number" || typeof v === "boolean"
          );
        }
        if (
          typeof q.answer === "string" ||
          typeof q.answer === "number" ||
          typeof q.answer === "boolean"
        ) {
          return [q.answer];
        }
        return [];
      };
      const correctSet = new Set<string | number | boolean>(normalizeAnswers());
      opciones = opts.map((texto, i) => ({
        texto,
        es_correcta: correctSet.has(texto),
        orden: i + 1,
      }));
    } else if (tipo === "verdadero_falso") {
      // Normalize answer to boolean if possible
      let correct = false;
      if (typeof q.answer === "boolean") correct = q.answer;
      if (typeof q.answer === "string") {
        const s = q.answer.trim().toLowerCase();
        correct = s === "true" || s === "verdadero" || s === "v";
      }
      // Represent as V/F options for downstream flows
      opciones = [
        { texto: "Verdadero", es_correcta: correct === true, orden: 1 },
        { texto: "Falso", es_correcta: correct === false, orden: 2 },
      ];
    }

    return {
      texto: q.prompt,
      tipo_id: tipo,
      puntaje: 1,
      orden: idx + 1,
      habilitada: true,
      opciones_respuesta: opciones,
      metadatos: {
        ai_id: q.id,
        rationale: q.rationale,
        difficulty: q.difficulty,
        taxonomy: Array.isArray(q.taxonomy) ? q.taxonomy : q.taxonomy,
        tags: q.tags,
        source: q.source,
      },
    };
  });

  return {
    titulo: exam.title,
    descripcion: "Generado por IA",
    materia: exam.subject,
    nivel: exam.level,
    idioma: exam.language,
    preguntas,
  };
}
