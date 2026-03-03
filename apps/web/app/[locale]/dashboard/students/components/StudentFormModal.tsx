"use client";

import { useState } from "react";
import { RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";

interface FormData {
  nombres: string;
  apellidos: string;
  fullName: string;
  identificacion: string;
  email: string;
  grupo_id: string;
}

interface Grupo {
  id: string;
  nombre: string;
  materias: {
    nombre: string;
  };
}

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  grupos: Grupo[];
  onSuccess: () => void;
}

const initialFormData: FormData = {
  nombres: "",
  apellidos: "",
  fullName: "",
  identificacion: "",
  email: "",
  grupo_id: "",
};

export function StudentFormModal({ open, onOpenChange, grupos, onSuccess }: StudentFormModalProps) {
  const t = useTranslations('dashboard.students');
  const tCommon = useTranslations('common');
  const tGroupStudents = useTranslations('dashboard.groups.students');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [separateNames, setSeparateNames] = useState(false);
  const [includeEmails, setIncludeEmails] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      grupo_id: value,
    }));
  };

  const trimValue = (value: string) => value.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const trimmedData: FormData = {
        nombres: trimValue(formData.nombres),
        apellidos: trimValue(formData.apellidos),
        fullName: trimValue(formData.fullName),
        identificacion: trimValue(formData.identificacion),
        email: trimValue(formData.email),
        grupo_id: formData.grupo_id,
      };

      const firstNamesValue = separateNames ? trimmedData.nombres : null;
      const lastNamesValue = separateNames ? trimmedData.apellidos : trimmedData.fullName;
      const emailValue = includeEmails ? trimmedData.email : '';

      if ((separateNames && (!firstNamesValue || !lastNamesValue)) || (!separateNames && !trimmedData.fullName) || !trimmedData.identificacion || !trimmedData.grupo_id) {
        setError(t('form.errors.requiredFields'));
        setIsSubmitting(false);
        return;
      }

      // Verificar que el grupo pertenece al profesor
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('form.errors.noSession'));
        setIsSubmitting(false);
        return;
      }

      const { data: grupoCheck, error: grupoError } = await supabase
        .from('grupos')
        .select('id')
        .eq('id', trimmedData.grupo_id)
        .eq('profesor_id', session.user.id)
        .single();

      if (grupoError || !grupoCheck) {
        setError(t('form.errors.invalidGroup'));
        setIsSubmitting(false);
        return;
      }

      // Crear el estudiante o usar uno existente
      const { data: existingStudent, error: checkError } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('identificacion', trimmedData.identificacion)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      let studentId;

      if (existingStudent && existingStudent.length > 0) {
        // Estudiante ya existe
        studentId = existingStudent[0].id;
      } else {
        // Crear nuevo estudiante
        const { data: newStudentId, error: rpcError } = await supabase.rpc('crear_estudiante_en_grupo', {
          p_nombres: firstNamesValue,
          p_apellidos: lastNamesValue,
          p_identificacion: trimmedData.identificacion,
          p_email: emailValue || null,
          p_grupo_id: trimmedData.grupo_id,
        });

        if (rpcError) {
          throw rpcError;
        }

        if (!newStudentId) {
          throw new Error(t('form.errors.generic'));
        }

        studentId = newStudentId;

        toast.success(tGroupStudents('success.studentAdded'), {
          description: tGroupStudents('success.studentAddedDescription'),
        });
        setFormData(initialFormData);
        onOpenChange(false);
        onSuccess();
        return;
      }

      // Vincular estudiante al grupo
      if (!studentId) {
        throw new Error(t('form.errors.noStudentToLink'));
      }

      const { error: linkError } = await supabase
        .from('estudiante_grupo')
        .upsert({
          estudiante_id: studentId,
          grupo_id: trimmedData.grupo_id,
        }, {
          onConflict: 'estudiante_id,grupo_id',
          ignoreDuplicates: true,
        });

      if (linkError) {
        throw linkError;
      }

      // Éxito
      toast.success(tGroupStudents('success.studentAdded'), {
        description: tGroupStudents('success.studentAddedDescription'),
      });

      setFormData(initialFormData);
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error adding student to group', error);
      setError(t('form.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FAFAF4] dark:bg-[#171717]">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>
            {t('form.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm font-medium">{tCommon('components.excelImport.options.title')}</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="separate-names"
                checked={separateNames}
                onCheckedChange={(checked) => setSeparateNames(checked === true)}
              />
              <Label htmlFor="separate-names" className="cursor-pointer text-sm">
                {tCommon('components.excelImport.options.separateNames')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-emails"
                checked={includeEmails}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setIncludeEmails(isChecked);
                  if (!isChecked) {
                    setFormData((prev) => ({ ...prev, email: '' }));
                  }
                }}
              />
              <Label htmlFor="include-emails" className="cursor-pointer text-sm">
                {tCommon('components.excelImport.options.includeEmails')}
              </Label>
            </div>
          </div>

          {separateNames ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nombres">{t('form.names')}*</Label>
                <Input
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  placeholder={t('form.placeholders.names')}
                  className="bg-white dark:bg-[#1E1E1F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidos">{t('form.surnames')}*</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder={t('form.placeholders.surnames')}
                  className="bg-white dark:bg-[#1E1E1F]"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fullName">{tCommon('components.excelImport.columns.fullName')}*</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={tCommon('components.excelImport.columns.fullName')}
                className="bg-white dark:bg-[#1E1E1F]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identificacion">{t('form.identification')}*</Label>
            <Input
              id="identificacion"
              name="identificacion"
              value={formData.identificacion}
              onChange={handleChange}
              placeholder={t('form.placeholders.identification')}
              className="bg-white dark:bg-[#1E1E1F]"
            />
          </div>

          {includeEmails && (
            <div className="space-y-2">
              <Label htmlFor="email">{t('form.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('form.placeholders.email')}
                className="bg-white dark:bg-[#1E1E1F]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="grupo">{t('form.group')}*</Label>
            <Select
              value={formData.grupo_id}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="bg-white dark:bg-[#1E1E1F]">
                <SelectValue placeholder={t('form.placeholders.selectGroup')} />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre} - {grupo.materias?.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('form.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('form.actions.creating')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('form.actions.create')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
