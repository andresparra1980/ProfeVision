"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Building2, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InstitutionData {
  id?: string;
  name: string;
  type: string;
}

interface InstitutionStepProps {
  data?: InstitutionData;
  onUpdate: (_data: InstitutionData) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

const INSTITUTION_TYPES = ["school", "university", "institute", "academy", "other"] as const;

export function InstitutionStep({ data: initialData, onUpdate, onNext, isSubmitting }: InstitutionStepProps) {
  const t = useTranslations("onboarding.institution");
  const tWizard = useTranslations("onboarding.wizard");
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "school");
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Create institution
      const { data: institution, error } = await supabase
        .from("entidades_educativas")
        .insert({
          nombre: name.trim(),
          tipo: type,
          profesor_id: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Create profesor_entidad relation using RPC (bypasses RLS)
      const { error: relationError } = await supabase.rpc("crear_relacion_profesor_entidad", {
        p_profesor_id: user.id,
        p_entidad_id: institution.id,
        p_es_admin: true,
      });

      if (relationError) {
        console.error("Error creating profesor_entidad relation:", relationError);
        // Don't fail the whole flow, institution was created
      }

      onUpdate({
        id: institution.id,
        name: name.trim(),
        type,
      });

      onNext();
    } catch (error) {
      console.error("Error creating institution:", error);
      toast.error("Error al crear la institucion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="institution-name">{t("nameLabel")}</Label>
          <Input
            id="institution-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="institution-type">{t("typeLabel")}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="institution-type">
              <SelectValue placeholder={t("typePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {INSTITUTION_TYPES.map((typeKey) => (
                <SelectItem key={typeKey} value={typeKey}>
                  {t(`types.${typeKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || saving || isSubmitting}
        >
          {saving ? tWizard("saving") : tWizard("continue")}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
