import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PDFExportButton } from '@/components/exam/pdf-export-button';
import type { ExamDetails, ResultadoExamen } from '../utils/types';

interface ResultsPageActionsProps {
  examDetails: ExamDetails | null;
  resultados: ResultadoExamen[];
  selectedGroupId: string | null;
  onExportExcel: () => void;
}

export function ResultsPageActions({
  examDetails,
  resultados,
  selectedGroupId,
  onExportExcel
}: ResultsPageActionsProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <Button
        onClick={onExportExcel}
        variant="default"
        className="flex items-center w-full sm:w-auto"
      >
        <Download className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">{t('downloadExcel')}</span>
        <span className="inline sm:hidden">{t('excelReport')}</span>
      </Button>

      {resultados.length > 0 && (
        <>
          <div className="hidden sm:block w-full sm:w-auto">
            <PDFExportButton
              groupId={selectedGroupId}
              fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
              buttonText={t('generatePDFReport')}
              resultados={resultados}
              examDetails={examDetails}
            />
          </div>
          <div className="sm:hidden block w-full">
            <PDFExportButton
              groupId={selectedGroupId}
              fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
              buttonText={t('pdfReport')}
              resultados={resultados}
              examDetails={examDetails}
            />
          </div>
        </>
      )}
    </div>
  );
}
