"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Props {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  question: ExamQuestion | null;
  onSave: (_updated: ExamQuestion) => void;
}

export default function QuestionEditorDialog({ open, onOpenChange, question, onSave }: Props) {
  const t = useTranslations('ai_exams_chat');
  const [local, setLocal] = useState<ExamQuestion | null>(null);
  const [original, setOriginal] = useState<ExamQuestion | null>(null);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  useEffect(() => {
    if (open) {
      const initialData = question ? JSON.parse(JSON.stringify(question)) : { type: "multiple_choice" };
      setLocal(initialData);
      setOriginal(JSON.parse(JSON.stringify(initialData)));
    }
  }, [open, question]);

  const isMC = useMemo(() => local?.type === "multiple_choice", [local]);

  const hasChanges = useMemo(() => {
    if (!local || !original) return false;
    return JSON.stringify(local) !== JSON.stringify(original);
  }, [local, original]);

  function update<K extends keyof ExamQuestion>(key: K, val: ExamQuestion[K]) {
    setLocal((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function updateOption(idx: number, text: string) {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      const oldText = options[idx];
      options[idx] = text;

      // If the current answer is the old text, update it to the new text
      let answer = prev.answer;
      if (typeof answer === "string" && answer === oldText) {
        answer = text;
      }

      return { ...prev, options, answer };
    });
  }

  function addOption() {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      options.push("");
      return { ...prev, options };
    });
  }

  function removeOption(idx: number) {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      options.splice(idx, 1);
      let answer = prev.answer;
      // Adjust numeric correct answer index if needed
      if (typeof answer === "number") {
        if (idx === answer) answer = -1;
        else if (idx < answer) answer = answer - 1;
      }
      return { ...prev, options, answer };
    });
  }

  function handleSave() {
    if (!local) return;
    // Basic cleanup for MC answers: ensure numeric index if options present
    if (local.type === "multiple_choice" && Array.isArray(local.options)) {
      if (typeof local.answer === "string") {
        const idx = local.options.findIndex((o) => o === local.answer);
        if (idx >= 0) local.answer = idx;
      }
      if (typeof local.answer !== "number") {
        // if still not numeric, set to 0 if exists
        if (local.options.length > 0) local.answer = 0;
      }
    }
    onSave(local);
    onOpenChange(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && hasChanges) {
      // Trying to close with unsaved changes
      setShowDiscardAlert(true);
    } else {
      // No changes or opening dialog
      onOpenChange(newOpen);
    }
  }

  function handleDiscard() {
    setShowDiscardAlert(false);
    onOpenChange(false);
  }

  function handleCancelDiscard() {
    setShowDiscardAlert(false);
  }

  function handleSaveFromAlert() {
    setShowDiscardAlert(false);
    handleSave();
  }

  if (!local) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto w-[98vw] max-w-[98vw] sm:w-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('editor.title')}</DialogTitle>
          <DialogDescription>{t('editor.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Enunciado */}
          <div className="grid gap-2">
            <Label>{t('editor.prompt')}</Label>
            <Textarea value={local.prompt || ""} onChange={(e) => update("prompt", e.target.value)} rows={4} />
          </div>

          {/* Opciones (solo MC) */}
          {isMC && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('editor.options')}</Label>
                <Button variant="outline" size="sm" onClick={addOption}>{t('editor.addOption')}</Button>
              </div>
              <RadioGroup
                value={typeof local.answer === "number" ? String(local.answer) : typeof local.answer === "string" ? String((local.options || []).indexOf(local.answer)) : "-1"}
                onValueChange={(v) => update("answer", Number(v))}
                className="space-y-2"
              >
                {(local.options || []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <RadioGroupItem
                      id={`opt-${idx}`}
                      value={String(idx)}
                    />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      className="flex-1"
                      placeholder={`Opción ${idx + 1}`}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" size="icon" onClick={() => removeOption(idx)}>
                            ×
                            <span className="sr-only">{t('editor.delete')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('editor.delete')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Verdadero/Falso */}
          {local.type === "true_false" && (
            <div className="grid gap-2">
              <Label>{t('editor.correctAnswer')}</Label>
              <RadioGroup
                value={typeof local.answer === "boolean" ? String(local.answer) : "true"}
                onValueChange={(v) => update("answer", v === "true")}
                className="grid gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="tf-true" value="true" />
                  <Label htmlFor="tf-true" className="font-normal">{t('results.true')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="tf-false" value="false" />
                  <Label htmlFor="tf-false" className="font-normal">{t('results.false')}</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Rationale */}
          <div className="grid gap-2">
            <Label>{t('editor.rationale')}</Label>
            <Textarea value={local.rationale || ""} onChange={(e) => update("rationale", e.target.value)} rows={3} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('editor.cancel')}</Button>
          <Button onClick={handleSave}>{t('editor.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editor.discardDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('editor.discardDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleCancelDiscard} className="mt-0">
            {t('editor.discardDialog.cancel')}
          </AlertDialogCancel>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button
              variant="destructive"
              onClick={handleDiscard}
              className="flex-1 sm:flex-none"
            >
              {t('editor.discardDialog.discard')}
            </Button>
            <Button
              onClick={handleSaveFromAlert}
              className="flex-1 sm:flex-none"
            >
              {t('editor.discardDialog.save')}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
