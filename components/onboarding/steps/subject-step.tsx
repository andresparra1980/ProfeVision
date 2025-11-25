"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronRight, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SubjectData {
  id?: string;
  name: string;
  description?: string;
}

interface SubjectStepProps {
  institutionName?: string;
  institutionId?: string;
  data?: SubjectData;
  onUpdate: (data: SubjectData) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function SubjectStep({ institutionName, institutionId, data, onUpdate, onNext, isSubmitting }: SubjectStepProps) {
  const t = useTranslations("onboarding.subject");
  const [name, setName] = useState(data?.name || "");
  const [description, setDescription] = useState(data?.description || "");
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0 && institutionId;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: subject, error } = await supabase
        .from("materias")
        .insert({
          nombre: name.trim(),
          descripcion: description.trim() || null,
          entidad_id: institutionId,
          profesor_id: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      onUpdate({
        id: subject.id,
        name: name.trim(),
        description: description.trim(),
      });

      onNext();
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error("Error al crear la materia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Institution badge */}
      {institutionName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="text-muted-foreground">{t("institutionLabel")}:</span>{" "}
            <span className="font-medium">{institutionName}</span>
          </span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject-name">{t("nameLabel")}</Label>
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject-description">{t("descriptionLabel")}</Label>
          <Textarea
            id="subject-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || saving || isSubmitting}
        >
          {saving ? "Guardando..." : t("title")}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
