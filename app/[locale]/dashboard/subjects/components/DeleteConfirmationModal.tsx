import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('dashboard.subjects.deleteModal');
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
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <div className="text-gray-600 dark:text-white">
          <p>
            {t('warningMessage')}{" "}
            <span className="font-semibold">
              {subjectName || t('selected')}
            </span>
            .
          </p>
          <p>
            {t('irreversibleAction')}{" "}
            <span className="font-semibold uppercase">{t('irreversible')}</span> {t('consequences')}
          </p>
          <ul className="list-disc list-inside ml-4 text-sm">
            <li>
              {t('deleteGroups')}{" "}
              <span className="font-semibold">{t('groups')}</span> {t('associated')}
            </li>
            <li>
              {t('deleteExams')}{" "}
              <span className="font-semibold">{t('exams')}</span> {t('createdFor')}
            </li>
            <li>
              {t('deleteResults')}{" "}
              <span className="font-semibold">
                {t('resultsAndGrades')}
              </span>{" "}
              {t('linked')}
            </li>
          </ul>
          <p className="mt-3">
            {t('confirmationInstruction')}
          </p>
        </div>
        <div className="grid gap-3 py-3">
          <Label
            htmlFor="subject-confirm-name"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('typeLabel')} &quot;
            <span className="font-semibold text-red-600 dark:text-red-400">
              {subjectName}
            </span>
            &quot; {t('toConfirm')}
          </Label>
          <Input
            id="subject-confirm-name"
            value={typedSubjectName}
            onChange={(e) => setTypedSubjectName(e.target.value)}
            placeholder={t('placeholder')}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
            autoFocus
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={typedSubjectName !== subjectName}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('confirmDelete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
