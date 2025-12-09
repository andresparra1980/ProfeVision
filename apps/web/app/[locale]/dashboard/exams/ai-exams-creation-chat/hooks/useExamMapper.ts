import React from "react";
import type { AIExamResult } from "../components/AIChatContext";
import type { ExamQuestion } from "../components/QuestionEditorDialog";

/**
 * Hook to map AI exam questions to API format
 */
export function useExamMapper(result: AIExamResult | null) {
  const mapAIQuestionsToApi = React.useCallback(() => {
    try {
      const examRes = result as AIExamResult | null;
      const qs: ExamQuestion[] = examRes?.exam?.questions || [];
      const mapped = qs.map((q) => {
        const type = q?.type || "multiple_choice";
        const prompt = q?.prompt || "";
        const retroalimentacion =
          (q as Partial<ExamQuestion> & { rationale?: string })?.rationale || "";

        if (type === "multiple_choice") {
          const options: string[] = Array.isArray(q?.options) ? q.options : [];
          const answer = q?.answer;
          let correctIndex: number | null = null;
          if (typeof answer === "number") correctIndex = answer;
          else if (typeof answer === "string") {
            const idx = options.findIndex((t) => t === answer);
            correctIndex = idx >= 0 ? idx : null;
          }
          return {
            texto: prompt,
            tipo: "opcion_multiple",
            opciones: options.map((texto, i) => ({
              texto,
              esCorrecta: i === correctIndex,
            })),
            retroalimentacion,
          };
        }

        if (type === "true_false") {
          let correct = false;
          if (typeof q?.answer === "boolean") correct = q.answer;
          else if (typeof q?.answer === "string") {
            const s = q.answer.trim().toLowerCase();
            correct = s === "true" || s === "verdadero" || s === "v";
          }
          return {
            texto: prompt,
            tipo: "verdadero_falso",
            opciones: [
              { texto: "Verdadero", esCorrecta: correct === true },
              { texto: "Falso", esCorrecta: correct === false },
            ],
            retroalimentacion,
          };
        }

        return {
          texto: prompt,
          tipo: "respuesta_corta",
          opciones: [],
          retroalimentacion,
        };
      });
      return mapped;
    } catch {
      return [] as Array<{
        texto: string;
        tipo: string;
        opciones: Array<{ texto: string; esCorrecta: boolean }>;
      }>;
    }
  }, [result]);

  return { mapAIQuestionsToApi };
}
