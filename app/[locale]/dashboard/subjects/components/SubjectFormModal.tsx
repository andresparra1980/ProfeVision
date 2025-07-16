import { useEffect } from "react";
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

const materiaSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  entidad_id: z.string().optional(),
});

type MateriaFormValues = z.infer<typeof materiaSchema>;

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
        <Button onClick={() => onCancel()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva materia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-[#FAFAF4] dark:bg-[#171717]">
        <DialogHeader>
          <DialogTitle>
            {editingMateria ? "Editar materia" : "Nueva materia"}
          </DialogTitle>
          <DialogDescription>
            {editingMateria
              ? "Actualiza la información de la materia."
              : "Ingresa los datos de la nueva materia."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre*</Label>
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
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Breve descripción de la materia"
              className="bg-white dark:bg-[#1E1E1F]"
              {...form.register("descripcion")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidad">Institución educativa</Label>
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
                <SelectValue placeholder="Selecciona una institución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {entidades.map((entidad) => (
                  <SelectItem key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si no asocias la materia con una institución, se considerará como
              privada.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingMateria ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
