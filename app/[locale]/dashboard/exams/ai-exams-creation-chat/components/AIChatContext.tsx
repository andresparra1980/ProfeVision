"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type AIExamResult = unknown; // server-validated contract will replace this

interface Ctx {
  result: AIExamResult | null;
  setResult: Dispatch<SetStateAction<AIExamResult | null>>;
}

const AIChatContext = createContext<Ctx | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<AIExamResult | null>(null);

  // Simple local-first persistence
  const STORAGE_KEY = "pv:ai-exam-result";

  // Sanitize helper to enforce contract compatibility
  function sanitizeResult(input: any): any {
    try {
      if (!input || typeof input !== 'object') return input;
      const cloned = JSON.parse(JSON.stringify(input));
      if (!cloned.exam || typeof cloned.exam !== 'object') {
        cloned.exam = { title: '', subject: '', level: '', language: '', questions: [] };
      }
      const exam = cloned.exam;
      exam.title = typeof exam.title === 'string' ? exam.title : '';
      exam.subject = typeof exam.subject === 'string' ? exam.subject : '';
      exam.level = typeof exam.level === 'string' ? exam.level : '';
      exam.language = typeof exam.language === 'string' ? exam.language : '';
      if (!Array.isArray(exam.questions)) exam.questions = [];
      const allowed = new Set(["easy", "medium", "hard"]);
      for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i] || {};
        // Ensure minimal structure
        q.id = typeof q.id === 'string' ? q.id : `q${i + 1}`;
        q.type = ["multiple_choice","true_false","short_answer","essay"].includes(q.type) ? q.type : "multiple_choice";
        q.prompt = typeof q.prompt === 'string' ? q.prompt : '';
        if (q.type === 'multiple_choice') {
          q.options = Array.isArray(q.options) ? q.options.filter((s: any) => typeof s === 'string') : [];
          if (q.options.length < 2) q.options = [...q.options, 'Opción A', 'Opción B'].slice(0, 2);
        } else {
          q.options = [];
        }
        if (!allowed.has(q.difficulty)) q.difficulty = 'medium';
        if (!q.rationale || typeof q.rationale !== 'string') q.rationale = '';
        if (!q.tags || !Array.isArray(q.tags)) q.tags = [];
        if (!q.taxonomy) q.taxonomy = 'understand';
        if (!q.source || typeof q.source !== 'object') q.source = { documentId: null, spans: [] };
        if (!Array.isArray(q.source.spans)) q.source.spans = [];
        exam.questions[i] = q;
      }
      return cloned;
    } catch {
      return input;
    }
  }

  // Load once on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const sanitized = sanitizeResult(parsed);
        setResult(sanitized);
      }
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (result == null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const sanitized = sanitizeResult(result);
        const a = JSON.stringify(result);
        const b = JSON.stringify(sanitized);
        if (a !== b) {
          // Update state with sanitized version to keep in-memory data valid for API calls
          setResult(sanitized);
          return; // persist will run again on next effect tick
        }
        localStorage.setItem(STORAGE_KEY, b);
      }
    } catch {
      // no-op
    }
  }, [result]);

  const value = useMemo(() => ({ result, setResult }), [result]);
  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error("useAIChat must be used within AIChatProvider");
  return ctx;
}

// Optional helper to clear persisted draft (can be used from dev tools)
export function clearPersistedAIExamDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("pv:ai-exam-result");
  } catch {
    // no-op
  }
}
