import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { GrupoExamen } from '../utils/types';

interface GroupSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableGroups: GrupoExamen[];
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
}

export function GroupSelectionDialog({
  open,
  onOpenChange,
  availableGroups,
  selectedGroupId,
  onSelect
}: GroupSelectionDialogProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogs.groupSelectionTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.groupSelectionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableGroups.map((grupo) => (
            <Button
              key={grupo.grupo_id}
              onClick={() => onSelect(grupo.grupo_id)}
              variant={selectedGroupId === grupo.grupo_id ? "default" : "outline"}
              className="w-full justify-start"
            >
              {grupo.nombre}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
