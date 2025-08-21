"use client";
import React, { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type AIExamResult = unknown; // server-validated contract will replace this

interface Ctx {
  result: AIExamResult | null;
  setResult: Dispatch<SetStateAction<AIExamResult | null>>;
}

const AIChatContext = createContext<Ctx | undefined>(undefined);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<AIExamResult | null>(null);
  const value = useMemo(() => ({ result, setResult }), [result]);
  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error("useAIChat must be used within AIChatProvider");
  return ctx;
}
