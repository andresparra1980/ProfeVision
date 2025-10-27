import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { ExamDetails } from '../utils/types';

interface ExamDetailsCardProps {
  examDetails: ExamDetails | null;
}

export function ExamDetailsCard({ examDetails }: ExamDetailsCardProps) {
  const t = useTranslations('dashboard.exams.results');

  if (!examDetails) return null;

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('examDetails')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('subject')}:</div>
            <div>{examDetails.materias?.nombre || t('noSubject')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('totalScore')}:</div>
            <div>{examDetails.puntaje_total}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('group')}:</div>
            <div>{examDetails.grupos?.nombre || t('noGroup')}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">{t('creationDate')}:</div>
            <div>{examDetails.created_at ? new Date(examDetails.created_at as string).toLocaleDateString() : t('notAvailable')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
