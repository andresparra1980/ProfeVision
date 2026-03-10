"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAIChat } from "./AIChatContext";
import type { AIExamResult } from "./AIChatContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import posthog from "posthog-js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import QuestionEditorDialog, { type ExamQuestion } from "./QuestionEditorDialog";
import MathText from "@/components/MathText";

interface ResultsViewProps {
  isSending?: boolean;
  onEditorDirtyChange?: (_dirty: boolean) => void;
  onEditingStateChange?: (_editing: boolean) => void;
}

export default function ResultsView({
  isSending = false,
  onEditorDirtyChange,
  onEditingStateChange,
}: ResultsViewProps) {
  const { result, setResult } = useAIChat();
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("q-0");
  const [accordionBeforeEdit, setAccordionBeforeEdit] = useState<string>("q-0");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const t = useTranslations('ai_exams_chat');

  const questions = useMemo(() => {
    return (result?.exam?.questions ?? []) as ExamQuestion[];
  }, [result]);

  const editingQuestion = editingIndex != null ? (questions[editingIndex] as ExamQuestion | undefined) : undefined;

  useEffect(() => {
    onEditingStateChange?.(Boolean(editingQuestion));
  }, [editingQuestion, onEditingStateChange]);



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

      // PostHog: Track options randomized
      posthog.capture('options_randomized', {
        question_count: qs.length,
        source: 'ai_exam_chat',
      });
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
    setAccordionBeforeEdit(openAccordionItem || `q-${idx}`);
    setEditingIndex(idx);
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

    // PostHog: Track question edited
    posthog.capture('question_edited', {
      question_index: editingIndex,
      question_type: updated.type,
      source: 'ai_exam_chat',
    });

    setEditingIndex(null);
    setOpenAccordionItem(accordionBeforeEdit || `q-${editingIndex}`);
  }

  function closeEditor() {
    onEditorDirtyChange?.(false);
    setEditingIndex(null);
    setOpenAccordionItem(accordionBeforeEdit || "q-0");
  }

  function openDeleteDialog(idx: number) {
    setDeleteIndex(idx);
    setShowDeleteAlert(true);
  }

  function handleDeleteConfirm() {
    if (deleteIndex === null) return;

    // Get question type before deletion for tracking
    const deletedQuestion = questions[deleteIndex];

    setResult((prev) => {
      if (!prev) return prev;
      const cloned = JSON.parse(JSON.stringify(prev));
      const qs: ExamQuestion[] = cloned?.exam?.questions ?? [];
      if (!Array.isArray(qs)) return prev;
      qs.splice(deleteIndex, 1);
      return cloned;
    });

    // PostHog: Track question deleted
    posthog.capture('question_deleted', {
      question_index: deleteIndex,
      question_type: deletedQuestion?.type,
      source: 'ai_exam_chat',
    });

    setShowDeleteAlert(false);
    setDeleteIndex(null);
  }

  function handleDeleteCancel() {
    setShowDeleteAlert(false);
    setDeleteIndex(null);
  }

  return (
    <div className="space-y-5 rounded-[28px] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950/60 sm:p-6">
      {editingQuestion ? (
        <QuestionEditorDialog
          question={editingQuestion}
          questionNumber={editingIndex != null ? editingIndex + 1 : undefined}
          onSave={saveEdited}
          onCancel={closeEditor}
          onDirtyChange={onEditorDirtyChange}
        />
      ) : (
        <>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-black/5 pb-5 dark:border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
            {t('results.generatedQuestions')}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {questions.length}
          </div>
          {isSending && questions.length > 0 && (
            <span className="mt-1 block text-xs text-muted-foreground">
              ({questions.length} {t('results.generatedSoFar', { fallback: 'generadas' })})
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={randomizeOptions}
            disabled={!questions.length || isSending}
            className="rounded-full"
          >
            {t('results.randomizeOptions')}
          </Button>
        </div>
        </div>
      </div>

      {/* Empty state */}
      {!questions.length && !isSending && (
        <div className="rounded-[24px] border border-dashed border-black/10 bg-white/60 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-zinc-900/40">
          {t('results.empty')}
        </div>
      )}

      {/* Loading state when generating first questions */}
      {!questions.length && isSending && (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-[24px] border border-dashed border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] py-10 text-center dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--chat-accent-ink))]" />
          <div className="text-sm text-muted-foreground">{t('results.generating', { fallback: 'Generando preguntas...' })}</div>
        </div>
      )}

      {/* Accordion with questions */}
      {!!questions.length && (
        <Accordion
          type="single"
          collapsible
          value={openAccordionItem}
          onValueChange={setOpenAccordionItem}
          className="w-full space-y-3"
        >
          {questions.map((q: ExamQuestion, idx: number) => {
            const isMC = q?.type === "multiple_choice";
            const title = q?.prompt || `Pregunta ${idx + 1}`;
            const rationale = q?.rationale as string | undefined;
            const options = Array.isArray(q?.options) ? q.options : [];
            const correctIdx = typeof q?.answer === "number" ? q.answer : (typeof q?.answer === "string" ? options.indexOf(q.answer) : -1);
            const isTF = q?.type === "true_false";
            return (
              <div key={idx} className="flex items-start gap-2 sm:gap-3">
                <AccordionItem value={`q-${idx}`} className="flex-1 overflow-hidden rounded-[24px] border border-black/10 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
                    <div className="flex flex-col items-start text-left w-full gap-1">
                      <div className="flex items-center gap-2 w-full">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--chat-accent-soft))] text-sm font-semibold text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
                          {idx + 1}
                        </span>
                        <div className="flex-1 prose prose-sm max-w-none font-semibold dark:prose-invert">
                          <MathText text={title} />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-black/5 bg-black/[0.02] px-4 pb-4 pt-4 dark:border-white/10 dark:bg-white/[0.02] sm:px-5">
                    {/* Body: options and controls */}
                    {isMC && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">{t('results.selectCorrect')}</div>
                        <RadioGroup value={String(correctIdx)} onValueChange={(v) => setCorrectAnswer(idx, Number(v))} className="grid gap-2">
                          {options.map((opt, i) => (
                            <div key={i} className={`flex items-start gap-3 rounded-2xl border p-3 transition-colors ${i === correctIdx ? "border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]" : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-950/60"}`}>
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
                          <div className={`flex items-center gap-3 rounded-2xl border p-3 ${q?.answer === true ? "border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]" : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-950/60"}`}>
                            <RadioGroupItem id={`q${idx}-tf-true`} value="true" />
                            <Label htmlFor={`q${idx}-tf-true`} className="font-normal">{t('results.true')}</Label>
                          </div>
                          <div className={`flex items-center gap-3 rounded-2xl border p-3 ${q?.answer === false ? "border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]" : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-950/60"}`}>
                            <RadioGroupItem id={`q${idx}-tf-false`} value="false" />
                            <Label htmlFor={`q${idx}-tf-false`} className="font-normal">{t('results.false')}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {rationale && (
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-1">{t('results.rationale')}</div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground italic">
                          <MathText text={rationale} />
                        </div>
                      </div>
                    )}

                    {/* Edit button inside accordion content, aligned to end */}
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditor(idx); }}
                        disabled={isSending}
                        className="rounded-full"
                      >
                        <Pencil className="h-4 w-4 mr-1" /> {t('results.edit')}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Delete button completely outside AccordionItem */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(idx); }}
                        disabled={isSending}
                        className="mt-3 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('results.delete')} {idx + 1}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('results.delete')} {idx + 1}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}

          {/* Loading skeletons for questions being generated */}
          {isSending && (
            <>
              {[...Array(3)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="border-2 border-dashed border-muted rounded-md p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </>
          )}
        </Accordion>
      )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('results.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('results.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {t('results.deleteDialog.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              {t('results.deleteDialog.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
