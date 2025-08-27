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

  // Load once on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setResult(parsed);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
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
