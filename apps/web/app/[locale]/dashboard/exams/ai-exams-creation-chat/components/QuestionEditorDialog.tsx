"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LatexIcon } from "@/components/icons/latex-icon";
import MathText from "@/components/MathText";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay" | string;

export interface ExamQuestion {
  id?: string;
  type?: QuestionType;
  prompt?: string;
  options?: string[];
  answer?: string | number | boolean | Array<string | number | boolean>;
  rationale?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
  taxonomy?: string | string[];
  tags?: string[];
  source?: { documentId: string | null; spans: Array<unknown> };
  [key: string]: unknown;
}

function hasLatexText(text: string): boolean {
  return /\$[^$]+\$|\$\$[\s\S]+\$\$|\\\(|\\\)|\\\[|\\\]|\\[a-zA-Z]+/.test(text);
}

interface Props {
  question: ExamQuestion | null;
  questionNumber?: number;
  onCancel: () => void;
  onSave: (_updated: ExamQuestion) => void;
  onDirtyChange?: (_dirty: boolean) => void;
}

function LatexFieldHint({ hint }: { hint: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute left-3 top-3 z-10 inline-flex cursor-help rounded-md border border-black/10 bg-white/80 p-1 text-muted-foreground dark:border-white/10 dark:bg-zinc-900/80">
            <LatexIcon className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PreviewFieldHint({ hint }: { hint: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute left-3 top-3 z-10 inline-flex cursor-help rounded-md border border-black/10 bg-white/80 p-1 text-muted-foreground dark:border-white/10 dark:bg-zinc-900/80">
            <Eye className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function QuestionEditorDialog({
  question,
  questionNumber,
  onCancel,
  onSave,
  onDirtyChange,
}: Props) {
  const t = useTranslations("ai_exams_chat");
  const [local, setLocal] = useState<ExamQuestion | null>(null);
  const [original, setOriginal] = useState<ExamQuestion | null>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  useEffect(() => {
    const initialData = question ? JSON.parse(JSON.stringify(question)) : { type: "multiple_choice" };
    setLocal(initialData);
    setOriginal(JSON.parse(JSON.stringify(initialData)));
    setShowDiscardPrompt(false);
  }, [question]);

  const isMC = useMemo(() => local?.type === "multiple_choice", [local]);

  const hasChanges = useMemo(() => {
    if (!local || !original) return false;
    return JSON.stringify(local) !== JSON.stringify(original);
  }, [local, original]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const hasValidAnswer = useMemo(() => {
    if (!local) return false;

    if (local.type === "multiple_choice") {
      const options = Array.isArray(local.options) ? local.options : [];
      if (typeof local.answer === "number") {
        return local.answer >= 0 && local.answer < options.length;
      }
      if (typeof local.answer === "string") {
        return options.includes(local.answer);
      }
      return false;
    }

    if (local.type === "true_false") {
      return typeof local.answer === "boolean";
    }

    return true;
  }, [local]);

  function update<K extends keyof ExamQuestion>(key: K, val: ExamQuestion[K]) {
    setLocal((prev) => (prev ? { ...prev, [key]: val } : prev));
    setShowDiscardPrompt(false);
  }

  function updateOption(idx: number, text: string) {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      const oldText = options[idx];
      options[idx] = text;

      let answer = prev.answer;
      if (typeof answer === "string" && answer === oldText) {
        answer = text;
      }

      return { ...prev, options, answer };
    });
    setShowDiscardPrompt(false);
  }

  function addOption() {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      options.push("");
      return { ...prev, options };
    });
    setShowDiscardPrompt(false);
  }

  function removeOption(idx: number) {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      options.splice(idx, 1);
      let answer = prev.answer;
      if (typeof answer === "number") {
        if (idx === answer) answer = -1;
        else if (idx < answer) answer = answer - 1;
      }
      return { ...prev, options, answer };
    });
    setShowDiscardPrompt(false);
  }

  function handleSave() {
    if (!local) return;

    const next = JSON.parse(JSON.stringify(local)) as ExamQuestion;
    if (next.type === "multiple_choice" && Array.isArray(next.options)) {
      if (typeof next.answer === "string") {
        const idx = next.options.findIndex((o) => o === next.answer);
        if (idx >= 0) next.answer = idx;
      }
      if (typeof next.answer !== "number" && next.options.length > 0) {
        next.answer = 0;
      }
    }

    onSave(next);
    onDirtyChange?.(false);
  }

  function handleDiscard() {
    if (original) {
      const reset = JSON.parse(JSON.stringify(original)) as ExamQuestion;
      setLocal(reset);
    }
    setShowDiscardPrompt(false);
    onDirtyChange?.(false);
    onCancel();
  }

  function handleBack() {
    if (hasChanges) {
      setShowDiscardPrompt(true);
      return;
    }
    onCancel();
  }

  if (!local) return null;

  const promptPreview = (local.prompt || "").trim();
  const rationalePreview = (local.rationale || "").trim();
  const showPromptLatexHint = hasLatexText(promptPreview);
  const showRationaleLatexHint = hasLatexText(rationalePreview);
  const showPromptPreview = hasLatexText(promptPreview);
  const showRationalePreview = hasLatexText(rationalePreview);
  const latexHint = t("editor.latexHint", { fallback: "Use LaTeX syntax for formulas in this field." });
  const previewHint = t("editor.previewHint", { fallback: "Preview of formatted content." });

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 border-b border-black/5 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))]">
            {questionNumber ? `${t("editor.title")} ${questionNumber}` : t("editor.title")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("editor.back", { fallback: "Back" })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border border-[rgb(var(--chat-accent-border))] bg-white text-[rgb(var(--chat-accent))] shadow-sm hover:bg-[rgb(var(--chat-accent-soft))] hover:text-[rgb(var(--chat-accent-ink))] dark:border-[rgb(var(--chat-accent-border))] dark:bg-[rgb(var(--chat-accent-soft))] dark:text-[rgb(var(--chat-accent-ink))] dark:hover:bg-[rgb(var(--chat-accent-soft))]/80 dark:hover:text-[rgb(var(--chat-accent-ink))] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSave}
            disabled={!hasValidAnswer || !hasChanges}
          >
            {t("editor.saveQuestion", { fallback: "Save Question" })}
          </Button>
        </div>
      </div>

      {showDiscardPrompt && (
        <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-amber-300/60 bg-amber-50 px-4 py-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("editor.discardDialog.title")}</div>
            <div className="text-sm text-muted-foreground">{t("editor.discardDialog.description")}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowDiscardPrompt(false)}>
              {t("editor.discardDialog.cancel")}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={handleDiscard}>
              {t("editor.discardDialog.discard")}
            </Button>
            <Button size="sm" className="rounded-full" onClick={handleSave} disabled={!hasValidAnswer}>
              {t("editor.discardDialog.save")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-5 rounded-[24px] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950/60 sm:p-5">
        <div className="grid gap-2">
          <Label>{t("editor.prompt")}</Label>
          <div className="relative">
            {showPromptLatexHint && <LatexFieldHint hint={latexHint} />}
            <Textarea
              value={local.prompt || ""}
              onChange={(e) => update("prompt", e.target.value)}
              rows={5}
              className={showPromptLatexHint ? "pl-12" : undefined}
            />
          </div>
          {showPromptPreview && (
            <div className="relative rounded-2xl border border-black/10 bg-white/80 p-3 pl-12 dark:border-white/10 dark:bg-zinc-900/70">
              <PreviewFieldHint hint={previewHint} />
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("editor.preview")}
              </div>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <MathText text={promptPreview} />
              </div>
            </div>
          )}
        </div>

        {isMC && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("editor.options")}</Label>
              <Button variant="outline" size="sm" className="rounded-full" onClick={addOption} disabled={(local.options || []).length >= 4}>
                {t("editor.addOption")}
              </Button>
            </div>
            <RadioGroup
              value={typeof local.answer === "number" ? String(local.answer) : typeof local.answer === "string" ? String((local.options || []).indexOf(local.answer)) : "-1"}
              onValueChange={(v) => update("answer", Number(v))}
              className="space-y-2"
            >
              {(local.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70">
                  <RadioGroupItem id={`opt-${idx}`} value={String(idx)} />
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      {hasLatexText(opt.trim()) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="absolute left-2.5 top-1/2 z-10 inline-flex -translate-y-1/2 cursor-help rounded-md border border-black/10 bg-white/80 p-1 text-muted-foreground dark:border-white/10 dark:bg-zinc-900/80">
                                <LatexIcon className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{latexHint}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        className={hasLatexText(opt.trim()) ? "flex-1 pl-10" : "flex-1"}
                        placeholder={`Opcion ${idx + 1}`}
                      />
                    </div>
                    {hasLatexText(opt.trim()) && (
                      <div className="relative rounded-xl border border-black/10 bg-black/[0.02] px-2 py-1.5 pl-10 text-sm dark:border-white/10 dark:bg-white/[0.02]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="absolute left-2 top-1/2 z-10 inline-flex -translate-y-1/2 cursor-help rounded-md border border-black/10 bg-white/80 p-1 text-muted-foreground dark:border-white/10 dark:bg-zinc-900/80">
                                <Eye className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{previewHint}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <MathText text={opt} />
                      </div>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(idx)}
                          disabled={(local.options || []).length <= 2}
                          className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-red-400"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">{t("editor.delete")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("editor.delete")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </RadioGroup>
            {!hasValidAnswer && (
              <p className="mt-2 text-sm text-destructive dark:text-red-400">{t("editor.mustSelectCorrectAnswer")}</p>
            )}
          </div>
        )}

        {local.type === "true_false" && (
          <div className="grid gap-2">
            <Label>{t("editor.correctAnswer")}</Label>
            <RadioGroup
              value={typeof local.answer === "boolean" ? String(local.answer) : "true"}
              onValueChange={(v) => update("answer", v === "true")}
              className="grid gap-2"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70">
                <RadioGroupItem id="tf-true" value="true" />
                <Label htmlFor="tf-true" className="font-normal">{t("results.true")}</Label>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-zinc-900/70">
                <RadioGroupItem id="tf-false" value="false" />
                <Label htmlFor="tf-false" className="font-normal">{t("results.false")}</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="grid gap-2">
          <Label>{t("editor.rationale")}</Label>
          <div className="relative">
            {showRationaleLatexHint && <LatexFieldHint hint={latexHint} />}
            <Textarea
              value={local.rationale || ""}
              onChange={(e) => update("rationale", e.target.value)}
              rows={4}
              className={showRationaleLatexHint ? "pl-12" : undefined}
            />
          </div>
          {showRationalePreview && (
            <div className="relative rounded-2xl border border-black/10 bg-white/80 p-3 pl-12 dark:border-white/10 dark:bg-zinc-900/70">
              <PreviewFieldHint hint={previewHint} />
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("editor.preview")}
              </div>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <MathText text={rationalePreview} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
