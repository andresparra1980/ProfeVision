"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SubjectData {
  id?: string;
  name: string;
  description?: string;
}

interface Institution {
  id: string;
  nombre: string;
}

interface SubjectStepProps {
  institutionId?: string;
  data?: SubjectData;
  onUpdate: (_data: SubjectData) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function SubjectStep({ institutionId: initialInstitutionId, data: initialData, onUpdate, onNext, isSubmitting }: SubjectStepProps) {
  const t = useTranslations("onboarding.subject");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Institutions
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(initialInstitutionId || "");

  // Load institutions on mount
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const { data, error } = await supabase
          .from("entidades_educativas")
          .select("id, nombre")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setInstitutions(data || []);
        
        // Prepopulate with most recent if no initial value
        if (!initialInstitutionId && data && data.length > 0) {
          setSelectedInstitutionId(data[0].id);
        }
      } catch (error) {
        console.error("Error loading institutions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInstitutions();
  }, [initialInstitutionId]);

  const isValid = name.trim().length > 0 && selectedInstitutionId;

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
          entidad_id: selectedInstitutionId,
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

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

      {/* Form */}
      <div className="space-y-4">
        {/* Institution Select */}
        <div className="space-y-2">
          <Label htmlFor="subject-institution">{t("institutionLabel")}</Label>
          {institutions.length > 0 ? (
            <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
              <SelectTrigger id="subject-institution">
                <SelectValue placeholder={t("selectInstitution")} />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-destructive">{t("noInstitutions")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject-name">{t("nameLabel")}</Label>
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
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
          {saving ? "Guardando..." : "Continuar"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
