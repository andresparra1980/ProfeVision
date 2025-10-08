import React from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAIChat } from "./AIChatContext";
import type { AIExamResult } from "./AIChatContext";
import type { ExamQuestion } from "./QuestionEditorDialog";
import { clearPersistedAIExamDraft } from "./AIChatContext";
import { clearLastDocumentContext } from "@/lib/persistence/browser";
import { clearIndexedDBStores } from "../utils/indexeddb-helpers";
import type { EditingExam } from "../hooks/useExamDraft";

// In-memory guards to prevent duplicate loads
const loadedOnce = new Set<string>();
const inFlightLoads = new Set<string>();

interface DraftLoaderProps {
  setEditingExam: (_exam: EditingExam | null) => void;
  setLoadedExamId: (_id: string | null) => void;
}

/**
 * Component that loads an existing exam draft from the database
 * and populates the AI chat context with it
 */
export function DraftLoader({ setEditingExam, setLoadedExamId }: DraftLoaderProps) {
  const { result, setResult } = useAIChat();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("ai_exams_chat");
  const examId = searchParams?.get("examId");
  const loadingRef = React.useRef(false);

  React.useEffect(() => {
    const load = async () => {
      if (!examId) return;
      // Avoid concurrent loads
      if (loadingRef.current) return;
      if (inFlightLoads.has(examId)) return;

      // If we've already completed a load for this exam in this tab, skip
      try {
        const doneOnce =
          typeof window !== "undefined"
            ? sessionStorage.getItem("pv:loaded-exam-id")
            : null;
        const hasNonEmpty = Boolean(
          (result as AIExamResult | null)?.exam?.questions &&
            (result as AIExamResult | null)!.exam!.questions!.length > 0
        );
        if (doneOnce === examId && hasNonEmpty) return;
      } catch (_e) {
        void _e;
      }

      // Persistent guard across remounts
      try {
        const loading =
          typeof window !== "undefined"
            ? sessionStorage.getItem("pv:loading-exam-id")
            : null;
        const loadingTsRaw =
          typeof window !== "undefined"
            ? sessionStorage.getItem("pv:loading-exam-ts")
            : null;
        const loadingTs = loadingTsRaw ? parseInt(loadingTsRaw, 10) : 0;
        const isRecent = Date.now() - loadingTs < 15000; // 15s window
        if (loading === examId && isRecent) return;

        // Clear stale loading markers
        if (loading === examId && !isRecent && typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("pv:loading-exam-id");
            sessionStorage.removeItem("pv:loading-exam-ts");
          } catch (_e) {
            void _e;
          }
        }
      } catch (_e) {
        void _e;
      }

      try {
        // Before loading a different exam, clear all local caches
        try {
          setResult(null);
          clearPersistedAIExamDraft();
        } catch (_e) {
          void _e;
        }
        try {
          clearLastDocumentContext();
        } catch (_e) {
          void _e;
        }
        try {
          await clearIndexedDBStores();
        } catch (_e) {
          void _e;
        }

        // Mark the latest clicked exam
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("pv:loaded-exam-id", examId);
            sessionStorage.setItem("pv:loaded-exam-ts", String(Date.now()));
          }
        } catch (_e) {
          void _e;
        }

        loadingRef.current = true;
        inFlightLoads.add(examId);
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("pv:loading-exam-id", examId);
            sessionStorage.setItem("pv:loading-exam-ts", String(Date.now()));
          }
        } catch (_e) {
          void _e;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No autorizado");

        // Fetch exam metadata
        const examRes = await fetch(`/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!examRes.ok) throw new Error("No se pudo cargar el examen");
        const exam = await examRes.json();
        setEditingExam({
          id: exam.id,
          titulo: exam.titulo,
          materia_id: exam.materia_id ?? null,
          duracion_minutos: exam.duracion_minutos ?? null,
          puntaje_total: exam.puntaje_total ?? null,
        });

        // Fetch questions with options
        const qRes = await fetch(`/api/exams/${examId}/questions-with-options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!qRes.ok) throw new Error("No se pudieron cargar las preguntas");
        const preguntas: Array<{
          id: string;
          texto: string;
          tipo_id: string;
          retroalimentacion?: string;
          opciones: Array<{ texto: string; es_correcta: boolean; orden: number }>;
        }> = await qRes.json();

        // Map to AI chat format
        const questions: ExamQuestion[] = preguntas.map((p) => {
          if (p.tipo_id === "opcion_multiple") {
            const opts = (p.opciones || [])
              .sort((a, b) => a.orden - b.orden)
              .map((o) => o.texto);
            const correctIndex = (p.opciones || []).findIndex((o) => o.es_correcta);
            return {
              type: "multiple_choice",
              prompt: p.texto,
              options: opts,
              answer: correctIndex >= 0 ? correctIndex : 0,
              rationale: p.retroalimentacion || "",
            };
          }
          if (p.tipo_id === "verdadero_falso") {
            const trueOpt = (p.opciones || []).find((o) =>
              o.texto.toLowerCase().includes("verdadero")
            );
            const falseOpt = (p.opciones || []).find((o) =>
              o.texto.toLowerCase().includes("falso")
            );
            const answer = trueOpt?.es_correcta
              ? true
              : falseOpt?.es_correcta
              ? false
              : false;
            return {
              type: "true_false",
              prompt: p.texto,
              answer,
              rationale: p.retroalimentacion || "",
            };
          }
          return {
            type: "short_answer",
            prompt: p.texto,
            answer: "",
            rationale: p.retroalimentacion || "",
          };
        });

        // Build normalized questions
        const normalizedQuestions: ExamQuestion[] = questions.map((q, idx: number) => {
          const type = (q.type as ExamQuestion["type"]) || "multiple_choice";
          const options = Array.isArray(q.options) ? q.options : [];
          const rawAnswer = (q as Partial<ExamQuestion>).answer;
          let answer: ExamQuestion["answer"] | undefined = undefined;
          if (typeof rawAnswer !== "undefined") {
            answer = rawAnswer as ExamQuestion["answer"];
          } else {
            if (type === "multiple_choice")
              answer = options.length > 0 ? 0 : undefined;
            else if (type === "true_false") answer = false;
            else answer = "";
          }
          const rationale = (q as Partial<ExamQuestion>).rationale ?? "";
          const difficulty = (q as Partial<ExamQuestion>).difficulty ?? "medium";
          const taxonomy = (q as Partial<ExamQuestion>).taxonomy ?? "understand";
          const tags = Array.isArray((q as Partial<ExamQuestion>).tags)
            ? (q as Partial<ExamQuestion>).tags!
            : [];
          const source =
            (q as Partial<ExamQuestion>).source ?? {
              documentId: null,
              spans: [],
            };
          return {
            id: `q${idx + 1}`,
            type,
            prompt: q.prompt || "",
            options,
            answer,
            rationale,
            difficulty,
            taxonomy,
            tags,
            source,
          } as ExamQuestion;
        });

        setResult({
          exam: {
            title: exam.titulo || "",
            subject: exam.materia_id ? String(exam.materia_id) : "general",
            level: "general",
            language: locale || "es",
            questions: normalizedQuestions,
          },
        } as AIExamResult);

        setLoadedExamId(examId);
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("pv:loaded-exam-id", examId);
            sessionStorage.setItem("pv:loaded-exam-ts", String(Date.now()));
          }
        } catch (_e) {
          void _e;
        }
        loadedOnce.add(examId);
        toast.success(t("loadDraft.successTitle"), {
          description: t("loadDraft.successDesc"),
        });
      } catch (e) {
        toast.error(t("loadDraft.errorTitle"), {
          description:
            e instanceof Error ? e.message : t("loadDraft.errorDesc"),
        });
      } finally {
        loadingRef.current = false;
        inFlightLoads.delete(examId);
        try {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("pv:loading-exam-id");
            sessionStorage.removeItem("pv:loading-exam-ts");
          }
        } catch (_e) {
          void _e;
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  return null;
}
