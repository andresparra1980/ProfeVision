import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, TriangleAlert } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  subjectName: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  subjectName,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [typedSubjectName, setTypedSubjectName] = useState<string>("");

  const handleCancel = () => {
    onCancel();
    setTypedSubjectName("");
  };

  const handleConfirm = async () => {
    await onConfirm();
    setTypedSubjectName("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTypedSubjectName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md border-red-500 dark:border-red-700 shadow-xl rounded-lg bg-card dark:bg-background">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400 text-2xl font-bold flex items-center">
            <TriangleAlert className="h-7 w-7 mr-2 text-red-600 dark:text-red-400" />
            ¡ADVERTENCIA! Eliminación Permanente
          </DialogTitle>
        </DialogHeader>
        <div className="text-gray-600 dark:text-white">
          <p>
            Está a punto de eliminar la materia{" "}
            <span className="font-semibold">
              {subjectName || "seleccionada"}
            </span>
            .
          </p>
          <p>
            Esta acción es{" "}
            <span className="font-semibold uppercase">IRREVERSIBLE</span> y
            resultará en:
          </p>
          <ul className="list-disc list-inside ml-4 text-sm">
            <li>
              Eliminación de todos los{" "}
              <span className="font-semibold">grupos</span> asociados.
            </li>
            <li>
              Eliminación de todos los{" "}
              <span className="font-semibold">exámenes</span> creados para esta
              materia.
            </li>
            <li>
              Eliminación de todos los{" "}
              <span className="font-semibold">
                resultados de exámenes y calificaciones
              </span>{" "}
              vinculadas.
            </li>
          </ul>
          <p className="mt-3">
            Para confirmar esta acción y proceder con la eliminación, por favor
            escriba el nombre exacto de la materia en el campo de abajo.
          </p>
        </div>
        <div className="grid gap-3 py-3">
          <Label
            htmlFor="subject-confirm-name"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Escriba &quot;
            <span className="font-semibold text-red-600 dark:text-red-400">
              {subjectName}
            </span>
            &quot; para confirmar:
          </Label>
          <Input
            id="subject-confirm-name"
            value={typedSubjectName}
            onChange={(e) => setTypedSubjectName(e.target.value)}
            placeholder="Nombre exacto de la materia"
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
            autoFocus
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={typedSubjectName !== subjectName}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sí, eliminar esta materia y sus datos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
