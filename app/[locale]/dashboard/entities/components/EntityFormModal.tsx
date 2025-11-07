"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FormData {
  nombre: string;
  tipo: string;
}

interface EntityFormModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess: () => void;
}

// Define a type for API errors
interface ApiError extends Error {
  status?: number;
  details?: string;
}

export function EntityFormModal({ open, onOpenChange, onSuccess }: EntityFormModalProps) {
  const t = useTranslations('dashboard.entities');
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    tipo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(t('toast.loginRequired'));
      }

      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const apiError = new Error(result.error || t('toast.creationError'));
        (apiError as ApiError).status = response.status;
        (apiError as ApiError).details = result.details;
        throw apiError;
      }

      toast.success(t('toast.successTitle'), {
        description: t('toast.successDescription'),
      });

      setFormData({
        nombre: '',
        tipo: '',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const errorObj = error as Error;
      const apiError = error as ApiError;
      const toastMessage = `Error: ${errorObj?.message || 'Desconocido'}${apiError.status ? ` (${apiError.status})` : ''}`;
      toast.error(t('toast.errorCreating'), {
        description: toastMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[500px] bg-[#FAFAF4] dark:bg-[#171717]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('form.addTitle')}</DialogTitle>
            <DialogDescription>
              {t('form.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">{t('form.nameLabel')}</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder={t('form.namePlaceholder')}
                className="bg-white dark:bg-[#1E1E1F]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">{t('form.typeLabel')}</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger id="tipo" className="bg-white dark:bg-[#1E1E1F]">
                  <SelectValue placeholder={t('form.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Universidad">{t('form.typeUniversity')}</SelectItem>
                  <SelectItem value="Instituto">{t('form.typeInstitute')}</SelectItem>
                  <SelectItem value="Colegio">{t('form.typeSchool')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('form.creating') : t('form.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
