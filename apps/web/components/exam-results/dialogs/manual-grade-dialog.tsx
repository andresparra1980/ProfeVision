import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Estudiante } from '../utils/types';

interface ManualGradeDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  estudiante: Estudiante | null;
  manualGrade: string;
  onGradeChange: (_grade: string) => void;
  isSubmitting: boolean;
  onSave: () => Promise<void>;
}

export function ManualGradeDialog({
  open,
  onOpenChange,
  estudiante,
  manualGrade,
  onGradeChange,
  isSubmitting,
  onSave
}: ManualGradeDialogProps) {
  const t = useTranslations('dashboard.exams.results');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.manualGradeTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.manualGradeDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md mt-3 mb-4 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">
            {t('dialogs.manualGradeWarning')}
          </span>
        </div>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="estudiante">{t('dialogs.studentLabel')}</Label>
            <Input
              id="estudiante"
              value={estudiante ? (estudiante.nombres ? `${estudiante.apellidos}, ${estudiante.nombres}` : estudiante.apellidos) : ''}
              disabled
            />
          </div>

          <div>
            <Label htmlFor="grade">{t('dialogs.gradeLabel')}</Label>
            <Input
              id="grade"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={manualGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {tc('buttons.cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting || !manualGrade}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('dialogs.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('dialogs.saveGrade')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
