"use client";

import { useState } from "react";
import { RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";

interface FormData {
  nombres: string;
  apellidos: string;
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
  identificacion: "",
  email: "",
  grupo_id: "",
};

export function StudentFormModal({ open, onOpenChange, grupos, onSuccess }: StudentFormModalProps) {
  const t = useTranslations('dashboard.students');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.nombres || !formData.apellidos || !formData.identificacion || !formData.grupo_id) {
        setError('Por favor completa todos los campos requeridos');
        setIsSubmitting(false);
        return;
      }

      // Verificar que el grupo pertenece al profesor
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No hay sesión activa');
        setIsSubmitting(false);
        return;
      }

      const { data: grupoCheck, error: grupoError } = await supabase
        .from('grupos')
        .select('id')
        .eq('id', formData.grupo_id)
        .eq('profesor_id', session.user.id)
        .single();

      if (grupoError || !grupoCheck) {
        setError('El grupo seleccionado no es válido');
        setIsSubmitting(false);
        return;
      }

      // Crear el estudiante o usar uno existente
      const { data: existingStudent, error: checkError } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('identificacion', formData.identificacion)
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
        const { data: newStudent, error: createError } = await supabase
          .from('estudiantes')
          .insert({
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            identificacion: formData.identificacion,
            email: formData.email || null,
          })
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        studentId = newStudent.id;
      }

      // Vincular estudiante al grupo
      const { error: linkError } = await supabase
        .from('estudiante_grupo')
        .insert({
          estudiante_id: studentId,
          grupo_id: formData.grupo_id,
        });

      if (linkError) {
        throw linkError;
      }

      // Éxito
      toast.success("Estudiante agregado", {
        description: "El estudiante ha sido agregado al grupo exitosamente",
      });

      setFormData(initialFormData);
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'Ha ocurrido un error al agregar el estudiante');
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
