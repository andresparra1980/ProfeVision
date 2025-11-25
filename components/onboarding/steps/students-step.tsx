"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { GraduationCap, ChevronRight, Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StudentData {
  id?: string;
  firstName: string;
  lastName: string;
  identification: string;
}

interface StudentsStepProps {
  groupId?: string;
  data?: StudentData[];
  onUpdate: (_data: StudentData[]) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function StudentsStep({ groupId, data: initialData, onUpdate, onNext, isSubmitting }: StudentsStepProps) {
  const t = useTranslations("onboarding.students");
  const [students, setStudents] = useState<StudentData[]>(initialData || []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identification, setIdentification] = useState("");
  const [saving, setSaving] = useState(false);

  const canAddStudent = firstName.trim() && lastName.trim() && identification.trim();

  const handleAddStudent = () => {
    if (!canAddStudent) return;
    
    const newStudent: StudentData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      identification: identification.trim(),
    };
    
    setStudents(prev => [...prev, newStudent]);
    setFirstName("");
    setLastName("");
    setIdentification("");
  };

  const handleRemoveStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!groupId) return;

    setSaving(true);
    try {
      // Insert students using RPC function (bypasses RLS with SECURITY DEFINER)
      const insertedStudents: StudentData[] = [];
      
      for (const student of students) {
        // Use crear_estudiante_en_grupo RPC which creates student AND links to group
        const { data: newStudentId, error } = await supabase
          .rpc("crear_estudiante_en_grupo", {
            p_nombres: student.firstName,
            p_apellidos: student.lastName,
            p_identificacion: student.identification,
            p_email: null,
            p_grupo_id: groupId,
          });

        if (error) throw error;

        insertedStudents.push({
          ...student,
          id: newStudentId,
        });
      }

      onUpdate(insertedStudents);
      onNext();
    } catch (error) {
      console.error("Error creating students:", error);
      toast.error("Error al crear estudiantes");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onUpdate([]);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">{t("manualTab")}</TabsTrigger>
          <TabsTrigger value="import">{t("importTab")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4 mt-4">
          {/* Add student form */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="student-firstname" className="text-xs">{t("firstNameLabel")}</Label>
              <Input
                id="student-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("firstNamePlaceholder")}
                size={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="student-lastname" className="text-xs">{t("lastNameLabel")}</Label>
              <Input
                id="student-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("lastNamePlaceholder")}
                size={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="student-id" className="text-xs">{t("idLabel")}</Label>
              <Input
                id="student-id"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder={t("idPlaceholder")}
                size={1}
              />
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStudent}
            disabled={!canAddStudent}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addStudent")}
          </Button>

          {/* Students list */}
          {students.length > 0 ? (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {students.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="text-sm">
                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                    <span className="text-muted-foreground ml-2">({student.identification})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStudent(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("noStudents")}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {t("studentCount", { count: students.length })}
          </p>
        </TabsContent>
        
        <TabsContent value="import" className="mt-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{t("importHint")}</p>
            <Button variant="outline" disabled>
              {t("importButton")}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Proximamente</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Skip warning */}
      {students.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{t("skipWarning")}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={saving || isSubmitting}
        >
          {t("skipStudents")}
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={students.length === 0 || saving || isSubmitting}
        >
          {saving ? "Guardando..." : "Continuar"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
