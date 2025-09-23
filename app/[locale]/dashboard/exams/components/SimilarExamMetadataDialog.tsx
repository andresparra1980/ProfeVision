"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

export type SimilarExamMeta = {
  title: string;
  materiaId: string;
  durationMinutes?: number;
  totalScore?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onConfirm: (_meta: SimilarExamMeta) => Promise<void> | void;
}

export default function SimilarExamMetadataDialog({ open, onOpenChange, onConfirm }: Props) {
  const t = useTranslations("dashboard.exams");
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([]);
  const [title, setTitle] = useState("");
  const [materiaId, setMateriaId] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [totalScore, setTotalScore] = useState<string>("100");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) return;
        // Load professor id from auth user (same as elsewhere)
        const { data: { user } } = await supabase.auth.getUser(session.session.access_token);
        if (!user) return;
        const { data } = await supabase
          .from("materias")
          .select("id, nombre")
          .eq("profesor_id", user.id)
          .order("nombre", { ascending: true });
        setMaterias(data || []);
      } catch {
        setMaterias([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setMateriaId("");
      setDuration("60");
      setTotalScore("100");
    }
  }, [open]);

  const canConfirm = useMemo(() => title.trim().length > 0 && materiaId, [title, materiaId]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onConfirm({
        title: title.trim(),
        materiaId,
        durationMinutes: Number.isNaN(Number(duration)) ? undefined : Number(duration),
        totalScore: Number.isNaN(Number(totalScore)) ? undefined : Number(totalScore),
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createWithAI.form.createExam", { defaultValue: "Guardar borrador de examen" })}</DialogTitle>
          <DialogDescription>
            {t("createWithAI.form.basicInfo", { defaultValue: "Completa la información general para guardar este examen como borrador." })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <Label>{t("form.title", { defaultValue: "Título" })}*</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("form.titlePlaceholder", { defaultValue: "Ej. Examen de lectura" })} />
          </div>
          <div className="space-y-1">
            <Label>{t("form.subject", { defaultValue: "Materia" })}*</Label>
            <Select value={materiaId} onValueChange={setMateriaId}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectSubject", { defaultValue: "Selecciona una materia" })} />
              </SelectTrigger>
              <SelectContent>
                {materias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("form.duration", { defaultValue: "Duración (min)" })}</Label>
            <Input type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("form.totalScore", { defaultValue: "Puntaje total" })}</Label>
            <Input type="number" inputMode="numeric" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("textExport.actions.close", { defaultValue: "Cancelar" })}</Button>
          <Button disabled={!canConfirm || loading} onClick={handleConfirm}>
            {t("createWithAI.form.createExam", { defaultValue: "Guardar borrador" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
