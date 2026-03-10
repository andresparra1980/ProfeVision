import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Database } from "@/lib/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"];
type EntidadEducativa =
  Database["public"]["Tables"]["entidades_educativas"]["Row"];

type MateriaFormValues = {
  nombre: string;
  descripcion?: string;
  entidad_id?: string;
};

interface SubjectFormModalProps {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  editingMateria: Materia | null;
  entidades: EntidadEducativa[];
  onSubmit: (_: MateriaFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SubjectFormModal({
  open,
  onOpenChange,
  editingMateria,
  entidades,
  onSubmit,
  onCancel,
}: SubjectFormModalProps) {
  const t = useTranslations('dashboard.subjects.form');
  const tSubjects = useTranslations('dashboard.subjects');
  
  const materiaSchema = z.object({
    nombre: z
      .string()
      .min(2, { message: t('nameError') }),
    descripcion: z.string().optional(),
    entidad_id: z.string().optional(),
  });

  const form = useForm<MateriaFormValues>({
    resolver: zodResolver(materiaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      entidad_id: "none",
    },
  });

  useEffect(() => {
    if (editingMateria) {
      form.reset({
        nombre: editingMateria.nombre,
        descripcion: editingMateria.descripcion || "",
        entidad_id: editingMateria.entidad_id || "none",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        entidad_id: "none",
      });
    }
  }, [editingMateria, form]);

  const handleSubmit = async (data: MateriaFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  const handleCancel = () => {
    onCancel();
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button onClick={() => onCancel()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {tSubjects('addSubject')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] rounded-2xl bg-[#FAFAF4] dark:bg-[#171717]">
        <DialogHeader>
          <DialogTitle>
            {editingMateria ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {editingMateria
              ? t('editDescription')
              : t('newDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">{t('nameLabel')}</Label>
            <Input
              id="nombre"
              className="bg-white dark:bg-[#1E1E1F]"
              {...form.register("nombre")}
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">{t('descriptionLabel')}</Label>
            <Textarea
              id="descripcion"
              placeholder={t('descriptionPlaceholder')}
              className="bg-white dark:bg-[#1E1E1F]"
              {...form.register("descripcion")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad">{t('institutionLabel')}</Label>
            <Select
              onValueChange={(value: string) =>
                form.setValue("entidad_id", value)
              }
              value={form.watch("entidad_id")}
            >
              <SelectTrigger
                id="entidad"
                className="bg-white dark:bg-[#1E1E1F]"
              >
                <SelectValue placeholder={t('institutionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('institutionNone')}</SelectItem>
                {entidades.map((entidad) => (
                  <SelectItem key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('institutionNote')}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button type="submit">
              {editingMateria ? t('update') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
