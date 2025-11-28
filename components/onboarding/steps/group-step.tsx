"use client";

import { useState, useEffect } from "react";
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
import { Users, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface GroupData {
  id?: string;
  name: string;
  year?: string;
  period?: string;
}

interface Subject {
  id: string;
  nombre: string;
  entidades_educativas: {
    nombre: string;
  } | null;
}

interface GroupStepProps {
  subjectName?: string;
  subjectId?: string;
  data?: GroupData;
  onUpdate: (_data: GroupData) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function GroupStep({ subjectId: initialSubjectId, data: initialData, onUpdate, onNext, isSubmitting }: GroupStepProps) {
  const t = useTranslations("onboarding.group");
  const [name, setName] = useState(initialData?.name || "");
  const [year, setYear] = useState(initialData?.year || "");
  const [period, setPeriod] = useState(initialData?.period || "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || "");

  // Load subjects on mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from("materias")
          .select("id, nombre, entidades_educativas(nombre)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setSubjects(data || []);
        
        // Prepopulate with most recent if no initial value
        if (!initialSubjectId && data && data.length > 0) {
          setSelectedSubjectId(data[0].id);
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [initialSubjectId]);

  const isValid = name.trim().length > 0 && selectedSubjectId;

  const getSubjectDisplayName = (subject: Subject) => {
    const institutionName = subject.entidades_educativas?.nombre;
    return institutionName 
      ? `${subject.nombre} - ${institutionName}`
      : subject.nombre;
  };

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
          materia_id: selectedSubjectId,
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
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Subject Select */}
        <div className="space-y-2">
          <Label htmlFor="group-subject">{t("subjectLabel")}</Label>
          {subjects.length > 0 ? (
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger id="group-subject">
                <SelectValue placeholder={t("selectSubject")} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {getSubjectDisplayName(subject)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-destructive">{t("noSubjects")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-name">{t("nameLabel")}</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
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
