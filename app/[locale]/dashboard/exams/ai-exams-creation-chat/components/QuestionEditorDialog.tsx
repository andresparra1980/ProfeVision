"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  useEffect(() => {
    if (open) setLocal(question ? JSON.parse(JSON.stringify(question)) : { type: "multiple_choice" });
  }, [open, question]);

  const isMC = useMemo(() => local?.type === "multiple_choice", [local]);

  function update<K extends keyof ExamQuestion>(key: K, val: ExamQuestion[K]) {
    setLocal((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function updateOption(idx: number, text: string) {
    setLocal((prev) => {
      if (!prev) return prev;
      const options = Array.isArray(prev.options) ? [...prev.options] : [];
      options[idx] = text;
      return { ...prev, options };
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

  if (!local) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editor.title')}</DialogTitle>
          <DialogDescription>{t('editor.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo */}
          <div className="grid gap-2">
            <Label>{t('editor.type')}</Label>
            <Select value={local.type || "multiple_choice"} onValueChange={(v) => update("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('editor.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">{t('editor.types.multiple_choice')}</SelectItem>
                <SelectItem value="true_false">{t('editor.types.true_false')}</SelectItem>
                <SelectItem value="short_answer">{t('editor.types.short_answer')}</SelectItem>
                <SelectItem value="essay">{t('editor.types.essay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              <div className="space-y-2">
                {(local.options || []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="flex-1" />
                    <Button variant="secondary" size="icon" onClick={() => removeOption(idx)} title={t('editor.delete')}>
                      ×
                    </Button>
                  </div>
                ))}
              </div>

              {/* Selección de respuesta correcta */}
              <div className="grid gap-2">
                <Label>{t('editor.correctAnswer')}</Label>
                <RadioGroup
                  value={typeof local.answer === "number" ? String(local.answer) : typeof local.answer === "string" ? String((local.options || []).indexOf(local.answer)) : "-1"}
                  onValueChange={(v) => update("answer", Number(v))}
                  className="grid gap-2"
                >
                  {(local.options || []).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <RadioGroupItem id={`opt-${idx}`} value={String(idx)} />
                      <Label htmlFor={`opt-${idx}`} className="font-normal">{opt || `Opción ${idx + 1}`}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
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

          {/* Dificultad */}
          <div className="grid gap-2">
            <Label>{t('editor.difficulty')}</Label>
            <Select value={(local.difficulty as string) || "medium"} onValueChange={(v) => update("difficulty", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('editor.difficulty')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t('editor.difficulties.easy')}</SelectItem>
                <SelectItem value="medium">{t('editor.difficulties.medium')}</SelectItem>
                <SelectItem value="hard">{t('editor.difficulties.hard')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('editor.cancel')}</Button>
          <Button onClick={handleSave}>{t('editor.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
