'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import dynamic from 'next/dynamic';

// Hooks
import { useExamResults } from '@/components/exam-results/hooks/use-exam-results';
import { useAnswerUpdate } from '@/components/exam-results/hooks/use-answer-update';
import { useManualGrade } from '@/components/exam-results/hooks/use-manual-grade';
import { useGroupSelection } from '@/components/exam-results/hooks/use-group-selection';

// Cards (lightweight - load immediately)
import { ExamDetailsCard } from '@/components/exam-results/cards/exam-details-card';
import { StatisticsCard } from '@/components/exam-results/cards/statistics-card';

// Heavy components - lazy load with skeletons
import {
  QuestionAnalysisCardSkeleton,
  AnswerAnalysisCardSkeleton,
  StudentsResultsTableSkeleton,
} from '@/components/exam-results/skeletons';

const QuestionAnalysisCard = dynamic(
  () => import('@/components/exam-results/cards/question-analysis-card').then(mod => ({ default: mod.QuestionAnalysisCard })),
  { loading: () => <QuestionAnalysisCardSkeleton /> }
);

const AnswerAnalysisCard = dynamic(
  () => import('@/components/exam-results/cards/answer-analysis-card').then(mod => ({ default: mod.AnswerAnalysisCard })),
  { loading: () => <AnswerAnalysisCardSkeleton /> }
);

const StudentsResultsTable = dynamic(
  () => import('@/components/exam-results/tables/students-results-table').then(mod => ({ default: mod.StudentsResultsTable })),
  { loading: () => <StudentsResultsTableSkeleton /> }
);

// Dialogs - lazy load (shown on demand)
const ConfirmAnswerChangeDialog = dynamic(
  () => import('@/components/exam-results/dialogs/confirm-answer-change-dialog').then(mod => ({ default: mod.ConfirmAnswerChangeDialog })),
  { ssr: false }
);

const StudentDetailsDialog = dynamic(
  () => import('@/components/exam-results/dialogs/student-details-dialog').then(mod => ({ default: mod.StudentDetailsDialog })),
  { ssr: false }
);

const ManualGradeDialog = dynamic(
  () => import('@/components/exam-results/dialogs/manual-grade-dialog').then(mod => ({ default: mod.ManualGradeDialog })),
  { ssr: false }
);

const GroupSelectionDialog = dynamic(
  () => import('@/components/exam-results/dialogs/group-selection-dialog').then(mod => ({ default: mod.GroupSelectionDialog })),
  { ssr: false }
);

// Shared
import { ResultsPageHeader } from '@/components/exam-results/shared/results-page-header';
import { ResultsPageActions } from '@/components/exam-results/shared/results-page-actions';
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';

// UI Components
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Types
import type { ResultadoExamen } from '@/components/exam-results/utils/types';
import { DEBUG } from '@/components/exam-results/utils/constants';

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard.exams.results');
  const tc = useTranslations('common');

  // Ensure exam ID exists and is a string
  const examId = typeof params.id === 'string' ? params.id : '';

  // Local UI state
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedResultado, setSelectedResultado] = useState<ResultadoExamen | null>(null);
  const [verSoloConExamen, setVerSoloConExamen] = useState(false);

  // Business logic via hooks
  const {
    loading,
    examDetails,
    resultados,
    todosEstudiantes,
    totalPreguntas,
    availableGroups,
    selectedGroupId,
    setResultados,
    fetchExamResults,
  } = useExamResults(examId);

  const {
    pendingUpdate,
    updatingAnswer,
    showConfirmDialog,
    setShowConfirmDialog,
    handleBubbleClick,
    handleConfirmUpdate,
  } = useAnswerUpdate({
    examId,
    setResultados,
    setSelectedResultado,
  });

  const {
    showManualGradeDialog,
    setShowManualGradeDialog,
    selectedEstudiante,
    manualGrade,
    setManualGrade,
    isSubmittingGrade,
    handleShowManualGradeDialog,
    handleSaveManualGrade,
  } = useManualGrade({
    examId,
    onGradeSaved: fetchExamResults,
  });

  const {
    showGroupSelectionModal,
    handleGroupSelect,
    handleToggleGroupSelectionModal,
    handleModalOpenChange,
  } = useGroupSelection({
    examId,
    availableGroups,
    selectedGroupId,
    onGroupChange: fetchExamResults,
    setLoading: () => {}, // Loading is handled by fetchExamResults
  });

  // Handlers
  const handleShowDetails = (resultado: ResultadoExamen) => {
    setSelectedResultado(resultado);
    setShowDetailsDialog(true);
  };

  const handleExportToExcel = () => {
    if (!examDetails || resultados.length === 0) {
      toast.error(tc('messages.error'), {
        description: t('toast.noResultsError'),
      });
      return;
    }

    try {
      // Crear datos para exportar
      // Nota: si nombres es null, apellidos contiene "Apellidos y Nombres" combinado
      const dataToExport = resultados.map(resultado => ({
        [t('excel.lastName')]: resultado.estudiante.apellidos,
        [t('excel.firstName')]: resultado.estudiante.nombres || '',
        [t('excel.identification')]: resultado.estudiante.identificacion,
        [t('excel.score')]: resultado.puntaje_obtenido.toFixed(2),
        [t('excel.percentage')]: `${resultado.porcentaje.toFixed(2)}%`,
        [t('excel.gradedDate')]: new Date(resultado.fecha_calificacion).toLocaleDateString()
      }));

      // Agregar estudiantes sin calificación
      todosEstudiantes
        .filter(estudiante => !resultados.some(r => r.estudiante.id === estudiante.id))
        .forEach(estudiante => {
          dataToExport.push({
            [t('excel.lastName')]: estudiante.apellidos,
            [t('excel.firstName')]: estudiante.nombres || '',
            [t('excel.identification')]: estudiante.identificacion,
            [t('excel.score')]: t('excel.notPresented'),
            [t('excel.percentage')]: "0.00%",
            [t('excel.gradedDate')]: ""
          });
        });

      // Ordenar datos por apellidos en orden ascendente usando etiqueta localizada
      const lastNameLabel = t('excel.lastName');
      dataToExport.sort((a, b) => {
        const aLast = String(a[lastNameLabel] ?? '');
        const bLast = String(b[lastNameLabel] ?? '');
        return aLast.localeCompare(bLast, locale);
      });

      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new();

      // Preparar los datos del encabezado
      const headerData = [
        [`${t('excel.resultsHeader')}: ${examDetails.titulo}`],
        [''],
        [t('excel.examDetailsHeader')],
        [`${t('excel.subjectLabel')}: ${examDetails.materias?.nombre || t('excel.noSubjectAvailable')}`],
        [`${t('excel.totalScoreLabel')}: ${examDetails.puntaje_total}`],
        [`${t('excel.groupLabel')}: ${examDetails.grupos?.nombre || t('excel.noGroupAvailable')}`],
        [`${t('excel.creationDateLabel')}: ${examDetails.created_at ? new Date(examDetails.created_at as string).toLocaleDateString() : t('excel.noDateAvailable')}`],
        [''],
        [t('excel.statisticsHeader')],
        [`${t('excel.studentsWithExamLabel')}: ${resultados.length} ${t('excel.of')} ${todosEstudiantes.length}`],
        [`${t('excel.averageLabel')}: ${resultados.length > 0 ? (resultados.reduce((sum, r) => sum + r.puntaje_obtenido, 0) / resultados.length).toFixed(2) : t('na')}`],
        [`${t('excel.highestScoreLabel')}: ${resultados.length > 0 ? Math.max(...resultados.map((r) => r.puntaje_obtenido)).toFixed(2) : t('na')}`],
        [`${t('excel.lowestScoreLabel')}: ${resultados.length > 0 ? Math.min(...resultados.map((r) => r.puntaje_obtenido)).toFixed(2) : t('na')}`],
        [''],
        [''] // Línea en blanco antes de los datos de estudiantes
      ];

      // Crear cabeceras de columnas (localizadas)
      const columnsRow = [
        t('excel.lastName'),
        t('excel.firstName'),
        t('excel.identification'),
        t('excel.score'),
        t('excel.percentage'),
        t('excel.gradedDate')
      ];

      // Combinar todo en una matriz
      const allData = [...headerData, columnsRow];

      // Agregar los datos de estudiantes convertidos a filas
      dataToExport.forEach(row => {
        allData.push(Object.values(row));
      });

      // Crear hoja y añadirla al libro
      const ws = XLSX.utils.aoa_to_sheet(allData);

      // Aplicar estilos (merge cells para título y secciones)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Detalles del examen
        { s: { r: 8, c: 0 }, e: { r: 8, c: 5 } }  // Estadísticas
      ];

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, t('excel.sheetName'));

      // Generar el archivo y descargarlo
      XLSX.writeFile(wb, `resultados_${examDetails.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

      toast.success(tc('messages.success'), {
        description: t('toast.exportSuccess'),
      });
    } catch (_error) {
      toast.error(tc('messages.error'), {
        description: t('toast.exportError'),
      });
      if (DEBUG) {
        // Registramos el error en un logger en lugar de la consola
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="ml-auto h-9 w-48" />
        </div>

        {/* Title card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>

        {/* Cards grid skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Question Analysis skeleton */}
        <QuestionAnalysisCardSkeleton />

        {/* Answer Analysis skeleton */}
        <AnswerAnalysisCardSkeleton />

        {/* Students table skeleton */}
        <StudentsResultsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with back button and group selector */}
      <ResultsPageHeader
        onBack={() => router.back()}
        availableGroups={availableGroups}
        selectedGroup={examDetails?.grupos}
        onToggleGroupModal={handleToggleGroupSelectionModal}
      />

      {/* Title card with depth */}
      <TitleCardWithDepth
        title={
          <>
            {t('title')}: {examDetails?.titulo || t('loading')}
          </>
        }
        description={t('description')}
        actions={
          <ResultsPageActions
            examDetails={examDetails}
            resultados={resultados}
            totalPreguntas={totalPreguntas}
            selectedGroupId={selectedGroupId}
            onExportExcel={handleExportToExcel}
          />
        }
      />

      {/* Cards grid */}
      {examDetails && (
        <div className="flex flex-col sm:flex-row gap-4">
          <ExamDetailsCard examDetails={examDetails} />
          <StatisticsCard resultados={resultados} todosEstudiantes={todosEstudiantes} />
        </div>
      )}

      {/* Question Analysis Card */}
      <QuestionAnalysisCard resultados={resultados} totalPreguntas={totalPreguntas} />

      {/* Answer Distribution Analysis Card (NEW) */}
      <AnswerAnalysisCard resultados={resultados} totalPreguntas={totalPreguntas} />

      {/* Filter checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="ver-solo-con-examen"
          checked={verSoloConExamen}
          onChange={(e) => setVerSoloConExamen(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="ver-solo-con-examen" className="text-sm">
          {t('checkbox.showOnlyGraded')}
        </label>
      </div>

      {/* Students table */}
      <StudentsResultsTable
        todosEstudiantes={todosEstudiantes}
        resultados={resultados}
        verSoloConExamen={verSoloConExamen}
        onShowDetails={handleShowDetails}
        onShowManualGrade={handleShowManualGradeDialog}
      />

      {/* Dialogs */}
      <ConfirmAnswerChangeDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        pendingUpdate={pendingUpdate}
        updatingAnswer={updatingAnswer}
        onConfirm={handleConfirmUpdate}
      />

      <StudentDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        resultado={selectedResultado}
        totalPreguntas={totalPreguntas}
        onBubbleClick={handleBubbleClick}
      />

      <ManualGradeDialog
        open={showManualGradeDialog}
        onOpenChange={setShowManualGradeDialog}
        estudiante={selectedEstudiante}
        manualGrade={manualGrade}
        onGradeChange={setManualGrade}
        isSubmitting={isSubmittingGrade}
        onSave={handleSaveManualGrade}
      />

      <GroupSelectionDialog
        open={showGroupSelectionModal}
        onOpenChange={handleModalOpenChange}
        availableGroups={availableGroups}
        selectedGroupId={selectedGroupId}
        onSelect={handleGroupSelect}
      />
    </div>
  );
}
