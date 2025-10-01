"use client";
import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAIChat } from "./AIChatContext";
import type { AIExamResult } from "./AIChatContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import QuestionEditorDialog, { type ExamQuestion } from "./QuestionEditorDialog";
import MathText from "@/components/MathText";

export default function ResultsView() {
  const { result, setResult } = useAIChat();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const t = useTranslations('ai_exams_chat');

  const questions = useMemo(() => {
    return (result?.exam?.questions ?? []) as ExamQuestion[];
  }, [result]);

  

  function randomizeOptions() {
    if (!result) return;
    try {
      const cloned: AIExamResult = JSON.parse(JSON.stringify(result));
      const qs: ExamQuestion[] = cloned.exam?.questions ?? [];
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
        const opts: string[] = Array.isArray(q.options) ? q.options : [];
        if (!Array.isArray(opts) || opts.length < 2) continue;
        let correctIndex: number | null = null;
        if (typeof q.answer === "number" && q.answer >= 0 && q.answer < opts.length) {
          correctIndex = q.answer;
        } else if (typeof q.answer === "string") {
          const idx = opts.findIndex((t) => t === q.answer);
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
      void _e; // ignore failures while randomizing
    }
  }

  function setCorrectAnswer(qIndex: number, value: number | boolean) {
    setResult((prev) => {
      if (!prev) return prev;
      const cloned = JSON.parse(JSON.stringify(prev));
      const qs: ExamQuestion[] = cloned?.exam?.questions ?? [];
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
    setResult((prev) => {
      if (!prev) return prev;
      const cloned = JSON.parse(JSON.stringify(prev));
      const qs: ExamQuestion[] = cloned?.exam?.questions ?? [];
      if (!Array.isArray(qs) || editingIndex == null) return prev;
      qs[editingIndex] = updated;
      return cloned;
    });
  }

  return (
    <div className="rounded-md border p-3 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="font-medium">{t('results.generatedQuestions')}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={randomizeOptions} disabled={!questions.length}>{t('results.randomizeOptions')}</Button>
        </div>
      </div>

      {/* Empty state */}
      {!questions.length && (
        <div className="text-sm text-muted-foreground">{t('results.empty')}</div>
      )}

      {/* Accordion with questions */}
      {!!questions.length && (
        <Accordion type="single" collapsible defaultValue={`q-0`} className="w-full space-y-2">
          {questions.map((q: ExamQuestion, idx: number) => {
            const isMC = q?.type === "multiple_choice";
            const title = q?.prompt || `Pregunta ${idx + 1}`;
            const rationale = q?.rationale as string | undefined;
            const options = Array.isArray(q?.options) ? q.options : [];
            const correctIdx = typeof q?.answer === "number" ? q.answer : (typeof q?.answer === "string" ? options.indexOf(q.answer) : -1);
            const isTF = q?.type === "true_false";
            return (
              <AccordionItem key={idx} value={`q-${idx}`} className="border-2 border-purple-400/50 rounded-md bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-col items-start text-left w-full gap-1">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">{idx + 1}.</span>
                      <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                        <MathText text={title} />
                      </div>
                      {/* difficulty pill removed to give more space to accordion icon */}
                    </div>
                    {/* Removed options and answer preview from header; these are visible in content when expanded */}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 border-t bg-muted/20">
                  {/* Body: options and controls */}
                  {isMC && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">{t('results.selectCorrect')}</div>
                      <RadioGroup value={String(correctIdx)} onValueChange={(v) => setCorrectAnswer(idx, Number(v))} className="grid gap-2">
                        {options.map((opt, i) => (
                          <div key={i} className={`flex items-start gap-2 rounded border p-2 ${i === correctIdx ? "border-primary bg-primary/5" : ""}`}>
                            <RadioGroupItem id={`q${idx}-opt${i}`} value={String(i)} />
                            <Label htmlFor={`q${idx}-opt${i}`} className="font-normal flex-1">
                              <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
                              <span className="prose prose-sm dark:prose-invert max-w-none inline-block align-middle">
                                <MathText text={opt || `Opción ${i + 1}`} />
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {isTF && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t('results.selectCorrect')}</div>
                      <RadioGroup value={String(q?.answer)} onValueChange={(v) => setCorrectAnswer(idx, v === "true")} className="grid gap-2">
                        <div className={`flex items-center gap-2 rounded border p-2 ${q?.answer === true ? "border-primary bg-primary/5" : ""}`}>
                          <RadioGroupItem id={`q${idx}-tf-true`} value="true" />
                          <Label htmlFor={`q${idx}-tf-true`} className="font-normal">{t('results.true')}</Label>
                        </div>
                        <div className={`flex items-center gap-2 rounded border p-2 ${q?.answer === false ? "border-primary bg-primary/5" : ""}`}>
                          <RadioGroupItem id={`q${idx}-tf-false`} value="false" />
                          <Label htmlFor={`q${idx}-tf-false`} className="font-normal">{t('results.false')}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {rationale && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-1">{t('results.rationale')}</div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                        <MathText text={rationale} />
                      </div>
                    </div>
                  )}

                  {/* Moved Edit button inside accordion content, aligned to end */}
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditor(idx); }}>
                      <Pencil className="h-4 w-4 mr-1" /> {t('results.edit')}
                    </Button>
                  </div>
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
