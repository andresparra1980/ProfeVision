"use client";
import React from "react";
import { useAIChat } from "./AIChatContext";

// Placeholder result flows through AIChatContext

// Minimal types for CSV export
type CSVQuestion = {
  type?: string;
  prompt?: string;
  options?: string[];
  answer?: string | number | boolean | Array<string | number | boolean>;
  rationale?: string;
  difficulty?: string;
  taxonomy?: string | string[];
  tags?: string[];
};

type CSVExamResult = {
  exam?: {
    title?: string;
    questions?: CSVQuestion[];
  };
};

export default function ResultsView() {
  const { result, setResult } = useAIChat();

  function exportJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toCSV(): string | null {
    // If it looks like an exam contract, flatten questions
    const examRes = (result as CSVExamResult | null);
    const questions: CSVQuestion[] = examRes?.exam?.questions ?? [];
    if (!Array.isArray(questions) || questions.length === 0) return null;
    const headers = [
      "index",
      "type",
      "prompt",
      "options",
      "answer",
      "rationale",
      "difficulty",
      "taxonomy",
      "tags",
    ];
    const lines = [headers.join(",")];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const row = [
        String(i + 1),
        JSON.stringify(q.type ?? ""),
        JSON.stringify(q.prompt ?? ""),
        JSON.stringify((q.options ?? []).join(" | ")),
        JSON.stringify(q.answer ?? ""),
        JSON.stringify(q.rationale ?? ""),
        JSON.stringify(q.difficulty ?? ""),
        JSON.stringify(Array.isArray(q.taxonomy) ? q.taxonomy.join("|") : q.taxonomy ?? ""),
        JSON.stringify((q.tags ?? []).join("|")),
      ];
      lines.push(row.join(","));
    }
    return lines.join("\n");
  }

  function exportCSV() {
    const csv = toCSV();
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Aleatorizar opciones de preguntas multiple_choice y actualizar índice de respuesta
  function randomizeOptions() {
    if (!result) return;
    try {
      const cloned: any = JSON.parse(JSON.stringify(result));
      const questions: any[] = cloned?.exam?.questions;
      if (!Array.isArray(questions)) return;

      const shuffle = <T,>(arr: T[]): T[] => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        if (!q || q.type !== "multiple_choice") continue;
        const opts: unknown = q.options;
        if (!Array.isArray(opts) || opts.length < 2) continue;

        // Determinar índice correcto original
        let correctIndex: number | null = null;
        if (typeof q.answer === "number" && q.answer >= 0 && q.answer < opts.length) {
          correctIndex = q.answer;
        } else if (typeof q.answer === "string") {
          const idx = opts.findIndex((t: any) => t === q.answer);
          correctIndex = idx >= 0 ? idx : null;
        }
        if (correctIndex == null) continue;

        // Emparejar opciones con su índice original
        const paired = (opts as string[]).map((text, i) => ({ text, i }));
        const shuffled = shuffle(paired);
        const newOptions = shuffled.map((p) => p.text);
        const newCorrectIndex = shuffled.findIndex((p) => p.i === correctIndex);

        // Aplicar cambios
        q.options = newOptions;
        q.answer = newCorrectIndex >= 0 ? newCorrectIndex : q.answer;
      }

      setResult(cloned);
    } catch (_e) {
      // no-op: si falla, no mutamos el estado
    }
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Resultados</div>
        <div className="flex items-center gap-2">
          <button className="h-8 rounded border px-2 text-sm" onClick={randomizeOptions} disabled={!result}>
            Aleatorizar opciones
          </button>
          <button className="h-8 rounded border px-2 text-sm" onClick={exportJSON} disabled={!result}>
            Exportar JSON
          </button>
          <button className="h-8 rounded border px-2 text-sm" onClick={exportCSV} disabled={!result}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {result ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs bg-muted/30 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <span>Los resultados aparecerán aquí cuando se conecte el chat al endpoint.</span>
        )}
      </div>

      {/* Developer helper: allow pasting a JSON to preview */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Pegar JSON (solo para pruebas locales):</div>
        <textarea
          className="w-full min-h-24 rounded border p-2 text-xs"
          placeholder='{"exam": { "title": "...", "questions": [] }}'
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (!v) return;
            try {
              const parsed = JSON.parse(v);
              setResult(parsed);
            } catch (_e) {
              alert("JSON inválido");
            }
          }}
        />
      </div>
    </div>
  );
}
