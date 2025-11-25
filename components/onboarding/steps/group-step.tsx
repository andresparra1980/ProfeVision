"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Users, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface GroupData {
  id?: string;
  name: string;
  year?: string;
  period?: string;
}

interface GroupStepProps {
  subjectName?: string;
  subjectId?: string;
  data?: GroupData;
  onUpdate: (_data: GroupData) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function GroupStep({ subjectName, subjectId, data: initialData, onUpdate, onNext, isSubmitting }: GroupStepProps) {
  const t = useTranslations("onboarding.group");
  const [name, setName] = useState(initialData?.name || "");
  const [year, setYear] = useState(initialData?.year || "");
  const [period, setPeriod] = useState(initialData?.period || "");
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0 && subjectId;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: group, error } = await supabase
        .from("grupos")
        .insert({
          nombre: name.trim(),
          materia_id: subjectId,
          profesor_id: user.id,
          año_escolar: year.trim() || null,
          periodo_escolar: period.trim() || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      onUpdate({
        id: group.id,
        name: name.trim(),
        year: year.trim(),
        period: period.trim(),
      });

      onNext();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Error al crear el grupo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Subject badge */}
      {subjectName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="text-muted-foreground">{t("subjectLabel")}:</span>{" "}
            <span className="font-medium">{subjectName}</span>
          </span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-name">{t("nameLabel")}</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="group-year">{t("yearLabel")}</Label>
            <Input
              id="group-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder={t("yearPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-period">{t("periodLabel")}</Label>
            <Input
              id="group-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder={t("periodPlaceholder")}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || saving || isSubmitting}
        >
          {saving ? "Guardando..." : "Continuar"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
