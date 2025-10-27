import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PDFExportButton } from '@/components/exam/pdf-export-button';
import type { ExamDetails, ResultadoExamen } from '../utils/types';

interface ResultsPageActionsProps {
  examDetails: ExamDetails | null;
  resultados: ResultadoExamen[];
  totalPreguntas: number;
  selectedGroupId: string | null;
  onExportExcel: () => void;
}

export function ResultsPageActions({
  examDetails,
  resultados,
  totalPreguntas,
  selectedGroupId,
  onExportExcel
}: ResultsPageActionsProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={onExportExcel}
        variant="default"
        className="flex items-center"
      >
        <Download className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">{t('downloadExcel')}</span>
        <span className="inline sm:hidden">{t('excelReport')}</span>
      </Button>

      {resultados.length > 0 && (
        <div>
          <div className="hidden sm:block">
            <PDFExportButton
              groupId={selectedGroupId}
              fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
              buttonText={t('generatePDFReport')}
              totalPreguntas={totalPreguntas}
              resultados={resultados}
              examDetails={examDetails}
            />
          </div>
          <div className="sm:hidden block">
            <PDFExportButton
              groupId={selectedGroupId}
              fileName={`examenes_anonimizados_${examDetails?.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'examen'}.pdf`}
              buttonText={t('pdfReport')}
              totalPreguntas={totalPreguntas}
              resultados={resultados}
              examDetails={examDetails}
            />
          </div>
        </div>
      )}
    </div>
  );
}
