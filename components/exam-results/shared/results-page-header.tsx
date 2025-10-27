import { Button } from '@/components/ui/button';
import { ChevronLeft, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GrupoExamen } from '../utils/types';

interface ResultsPageHeaderProps {
  onBack: () => void;
  availableGroups: GrupoExamen[];
  selectedGroup: { id: string; nombre: string } | null | undefined;
  onToggleGroupModal: () => void;
}

export function ResultsPageHeader({
  onBack,
  availableGroups,
  selectedGroup,
  onToggleGroupModal
}: ResultsPageHeaderProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <div className="flex justify-between items-center mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-9"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t('backToExams')}
      </Button>

      {availableGroups.length > 1 && (
        <Button
          onClick={onToggleGroupModal}
          variant="outline"
          className="flex items-center text-xs sm:text-sm bg-card text-foreground dark:text-foreground dark:hover:text-background"
        >
          <div className="flex items-center px-3 py-2 w-full h-full">
            <Users className="mr-2 h-4 w-4 " />
            <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
              GRUPO: {selectedGroup?.nombre || 'Sin grupo'}
            </span>
          </div>
        </Button>
      )}
    </div>
  );
}
