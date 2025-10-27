import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PendingUpdate } from '../utils/types';

interface ConfirmAnswerChangeDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pendingUpdate: PendingUpdate | null;
  updatingAnswer: boolean;
  onConfirm: () => Promise<void>;
}

export function ConfirmAnswerChangeDialog({
  open,
  onOpenChange,
  pendingUpdate,
  updatingAnswer,
  onConfirm
}: ConfirmAnswerChangeDialogProps) {
  const t = useTranslations('dashboard.exams.results');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.confirmChangeTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.confirmChangeDescription', {
              question: pendingUpdate?.preguntaOrden || 0,
              option: pendingUpdate?.nuevaLetra || ''
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatingAnswer}
          >
            {tc('buttons.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={updatingAnswer}
          >
            {updatingAnswer ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('dialogs.updating')}
              </>
            ) : (
              t('dialogs.confirmChangeButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
