"use client";
import React, { useMemo, useState } from "react";
import { useAIChat } from "./AIChatContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import QuestionEditorDialog, { type ExamQuestion } from "./QuestionEditorDialog";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const questions = useMemo(() => {
    const examRes = (result as CSVExamResult | null);
    return examRes?.exam?.questions ?? [];
  }, [result]);

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
    const examRes = (result as CSVExamResult | null);
    const qs: CSVQuestion[] = examRes?.exam?.questions ?? [];
    if (!Array.isArray(qs) || qs.length === 0) return null;
    const headers = ["index", "type", "prompt", "options", "answer", "rationale", "difficulty", "taxonomy", "tags"];
    const lines = [headers.join(",")];
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
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

  function randomizeOptions() {
    if (!result) return;
    try {
      const cloned: any = JSON.parse(JSON.stringify(result));
      const qs: any[] = cloned?.exam?.questions;
      if (!Array.isArray(qs)) return;
      const shuffle = <T,>(arr: T[]): T[] => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      for (let qi = 0; qi < qs.length; qi++) {
        const q = qs[qi];
        if (!q || q.type !== "multiple_choice") continue;
        const opts: unknown = q.options;
        if (!Array.isArray(opts) || opts.length < 2) continue;
        let correctIndex: number | null = null;
        if (typeof q.answer === "number" && q.answer >= 0 && q.answer < opts.length) {
          correctIndex = q.answer;
        } else if (typeof q.answer === "string") {
          const idx = opts.findIndex((t: any) => t === q.answer);
          correctIndex = idx >= 0 ? idx : null;
        }
        if (correctIndex == null) continue;
        const paired = (opts as string[]).map((text, i) => ({ text, i }));
        const shuffled = shuffle(paired);
        const newOptions = shuffled.map((p) => p.text);
        const newCorrectIndex = shuffled.findIndex((p) => p.i === correctIndex);
        q.options = newOptions;
        q.answer = newCorrectIndex >= 0 ? newCorrectIndex : q.answer;
      }
      setResult(cloned);
    } catch (_e) {
      // ignore failures while randomizing
    }
  }

  function setCorrectAnswer(qIndex: number, value: number | boolean) {
    setResult((prev: any) => {
      if (!prev) return prev;
      const cloned = JSON.parse(JSON.stringify(prev));
      const qs = cloned?.exam?.questions;
      if (!Array.isArray(qs) || !qs[qIndex]) return prev;
      qs[qIndex].answer = value;
      return cloned;
    });
  }

  function openEditor(idx: number) {
    setEditingIndex(idx);
    setEditorOpen(true);
  }

  function saveEdited(updated: ExamQuestion) {
    setResult((prev: any) => {
      if (!prev) return prev;
      const cloned = JSON.parse(JSON.stringify(prev));
      const qs = cloned?.exam?.questions;
      if (!Array.isArray(qs) || editingIndex == null) return prev;
      qs[editingIndex] = updated;
      return cloned;
    });
  }

  return (
    <div className="rounded-md border p-3 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Preguntas generadas</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={randomizeOptions} disabled={!questions.length}>Aleatorizar opciones</Button>
          <Button variant="outline" size="sm" onClick={exportJSON} disabled={!questions.length}>Exportar JSON</Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!questions.length}>Exportar CSV</Button>
        </div>
      </div>

      {/* Empty state */}
      {!questions.length && (
        <div className="text-sm text-muted-foreground">Los resultados aparecerán aquí cuando se conecte el chat al endpoint.</div>
      )}

      {/* Accordion with questions */}
      {!!questions.length && (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {questions.map((q, idx) => {
            const isMC = q?.type === "multiple_choice";
            const title = q?.prompt || `Pregunta ${idx + 1}`;
            const difficulty = (q?.difficulty as string) || undefined;
            const rationale = (q as any)?.rationale as string | undefined;
            const options = Array.isArray(q?.options) ? q.options : [];
            const correctIdx = typeof q?.answer === "number" ? q.answer : (typeof q?.answer === "string" ? options.indexOf(q.answer) : -1);
            const isTF = q?.type === "true_false";
            return (
              <AccordionItem key={idx} value={`q-${idx}`} className="border rounded-md bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-col items-start text-left w-full gap-1">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">{idx + 1}.</span>
                      <span className="flex-1 line-clamp-2">{title}</span>
                      {difficulty && <Badge variant="secondary">{difficulty}</Badge>}
                      <Button variant="ghost" size="sm" asChild>
                        <span onClick={(e) => { e.stopPropagation(); openEditor(idx); }} className="inline-flex items-center">
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </span>
                      </Button>
                    </div>
                    {isMC && options.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {options.map((opt, i) => (
                          <span key={i} className={"mr-2 inline-block " + (i === correctIdx ? "text-primary font-medium" : "")}>{String.fromCharCode(65 + i)}. {opt}</span>
                        ))}
                      </div>
                    )}
                    {isTF && (
                      <div className="text-xs text-muted-foreground">Respuesta: {String(q?.answer)}</div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 border-t bg-muted/20">
                  {/* Body: options and controls */}
                  {isMC && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Selecciona la respuesta correcta:</div>
                      <RadioGroup value={String(correctIdx)} onValueChange={(v) => setCorrectAnswer(idx, Number(v))} className="grid gap-2">
                        {options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-2 rounded border p-2 ${i === correctIdx ? "border-primary bg-primary/5" : ""}`}>
                            <RadioGroupItem id={`q${idx}-opt${i}`} value={String(i)} />
                            <Label htmlFor={`q${idx}-opt${i}`} className="font-normal">{String.fromCharCode(65 + i)}. {opt || `Opción ${i + 1}`}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {isTF && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Selecciona la respuesta correcta:</div>
                      <RadioGroup value={String(q?.answer)} onValueChange={(v) => setCorrectAnswer(idx, v === "true")} className="grid gap-2">
                        <div className={`flex items-center gap-2 rounded border p-2 ${q?.answer === true ? "border-primary bg-primary/5" : ""}`}>
                          <RadioGroupItem id={`q${idx}-tf-true`} value="true" />
                          <Label htmlFor={`q${idx}-tf-true`} className="font-normal">Verdadero</Label>
                        </div>
                        <div className={`flex items-center gap-2 rounded border p-2 ${q?.answer === false ? "border-primary bg-primary/5" : ""}`}>
                          <RadioGroupItem id={`q${idx}-tf-false`} value="false" />
                          <Label htmlFor={`q${idx}-tf-false`} className="font-normal">Falso</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {rationale && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-1">Rationale</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{rationale}</div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Editor modal */}
      <QuestionEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        question={editingIndex != null ? (questions[editingIndex] as unknown as ExamQuestion) : null}
        onSave={saveEdited}
      />
    </div>
  );
}
