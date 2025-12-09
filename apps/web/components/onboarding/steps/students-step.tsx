"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { GraduationCap, ChevronRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ExcelImport } from "@/components/students/excel-import";

interface StudentData {
  id?: string;
  firstName: string | null;
  lastName: string;
  identification: string;
}

interface Group {
  id: string;
  nombre: string;
  materias: {
    nombre: string;
  } | null;
}

interface StudentsStepProps {
  groupId?: string;
  data?: StudentData[];
  onUpdate: (_data: StudentData[]) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function StudentsStep({ groupId: initialGroupId, data: initialData, onUpdate, onNext, isSubmitting }: StudentsStepProps) {
  const t = useTranslations("onboarding.students");
  const tWizard = useTranslations("onboarding.wizard");
  const [students, setStudents] = useState<StudentData[]>(initialData || []);
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identification, setIdentification] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || "");
  
  // Options matching excel-import
  const [separateNames, setSeparateNames] = useState(false);
  
  // Track if students were imported via Excel
  const [hasImportedStudents, setHasImportedStudents] = useState(false);

  // Load groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("grupos")
          .select("id, nombre, materias(nombre)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setGroups(data || []);
        
        // Prepopulate with most recent if no initial value
        if (!initialGroupId && data && data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [initialGroupId]);

  const canAddStudent = separateNames
    ? firstName.trim() && lastName.trim() && identification.trim()
    : fullName.trim() && identification.trim();

  const getGroupDisplayName = (group: Group) => {
    const subjectName = group.materias?.nombre;
    return subjectName 
      ? `${group.nombre} - ${subjectName}`
      : group.nombre;
  };

  const handleAddStudent = () => {
    if (!canAddStudent) return;
    
    const newStudent: StudentData = separateNames
      ? {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          identification: identification.trim(),
        }
      : {
          firstName: null,
          lastName: fullName.trim(),
          identification: identification.trim(),
        };
    
    setStudents(prev => [...prev, newStudent]);
    setFullName("");
    setFirstName("");
    setLastName("");
    setIdentification("");
  };

  const handleRemoveStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const handleImportComplete = (importedCount: number) => {
    if (importedCount > 0) {
      setHasImportedStudents(true);
    }
    toast.success(t("importSuccess"));
  };

  const handleSubmit = async () => {
    if (!selectedGroupId) return;

    // If only imported students (no manual), just proceed
    if (students.length === 0 && hasImportedStudents) {
      onUpdate([]);
      onNext();
      return;
    }

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
            p_grupo_id: selectedGroupId,
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

  const getDisplayName = (student: StudentData) => {
    if (student.firstName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.lastName;
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
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Group Select */}
      <div className="space-y-2">
        <Label htmlFor="students-group">{t("groupLabel")}</Label>
        {groups.length > 0 ? (
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger id="students-group">
              <SelectValue placeholder={t("selectGroup")} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {getGroupDisplayName(group)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-destructive">{t("noGroups")}</p>
        )}
      </div>

      {/* Tabs - only show if group selected */}
      {selectedGroupId && (
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">{t("manualTab")}</TabsTrigger>
            <TabsTrigger value="import">{t("importTab")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 mt-4">
            {/* Option: separate names */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="separate-names-manual" 
                checked={separateNames}
                onCheckedChange={(checked) => setSeparateNames(checked === true)}
              />
              <Label htmlFor="separate-names-manual" className="text-sm cursor-pointer">
                {t("separateNamesOption")}
              </Label>
            </div>

            {/* Add student form - with border */}
            <div className="border rounded-lg p-3 space-y-3">
              {separateNames ? (
                /* Separate fields: Nombres y Apellidos */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="student-firstname" className="text-xs">{t("firstNameLabel")}</Label>
                    <Input
                      id="student-firstname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("firstNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="student-lastname" className="text-xs">{t("lastNameLabel")}</Label>
                    <Input
                      id="student-lastname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>
                </div>
              ) : (
                /* Combined field: Apellidos y Nombres */
                <div className="space-y-1">
                  <Label htmlFor="student-fullname" className="text-xs">{t("fullNameLabel")}</Label>
                  <Input
                    id="student-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>
              )}
              
              {/* Identificacion - full width mobile, narrow desktop */}
              <div className="space-y-1 md:max-w-[200px]">
                <Label htmlFor="student-id" className="text-xs">{t("idLabel")}</Label>
                <Input
                  id="student-id"
                  value={identification}
                  onChange={(e) => setIdentification(e.target.value)}
                  placeholder={t("idPlaceholder")}
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStudent}
                disabled={!canAddStudent}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addStudent")}
              </Button>
            </div>

            {/* Students list */}
            {students.length > 0 ? (
              <div className="border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                {students.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="text-sm">
                      <span className="font-medium">{getDisplayName(student)}</span>
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
            <ExcelImport 
              onImportComplete={handleImportComplete} 
              groupId={selectedGroupId} 
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={(students.length === 0 && !hasImportedStudents) || saving || isSubmitting || !selectedGroupId}
        >
          {saving ? tWizard("saving") : tWizard("continue")}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
