'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Hooks
import { useExamResults } from '@/components/exam-results/hooks/use-exam-results';
import { useAnswerUpdate } from '@/components/exam-results/hooks/use-answer-update';
import { useManualGrade } from '@/components/exam-results/hooks/use-manual-grade';
import { useGroupSelection } from '@/components/exam-results/hooks/use-group-selection';

// Cards
import { ExamDetailsCard } from '@/components/exam-results/cards/exam-details-card';
import { StatisticsCard } from '@/components/exam-results/cards/statistics-card';
import { QuestionAnalysisCard } from '@/components/exam-results/cards/question-analysis-card';

// Tables
import { StudentsResultsTable } from '@/components/exam-results/tables/students-results-table';

// Dialogs
import { ConfirmAnswerChangeDialog } from '@/components/exam-results/dialogs/confirm-answer-change-dialog';
import { StudentDetailsDialog } from '@/components/exam-results/dialogs/student-details-dialog';
import { ManualGradeDialog } from '@/components/exam-results/dialogs/manual-grade-dialog';
import { GroupSelectionDialog } from '@/components/exam-results/dialogs/group-selection-dialog';

// Shared
import { ResultsPageHeader } from '@/components/exam-results/shared/results-page-header';
import { ResultsPageActions } from '@/components/exam-results/shared/results-page-actions';

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
      const dataToExport = resultados.map(resultado => ({
        [t('excel.lastName')]: resultado.estudiante.apellidos,
        [t('excel.firstName')]: resultado.estudiante.nombres,
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
            [t('excel.firstName')]: estudiante.nombres,
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
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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

      {/* Title and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('title')}: {examDetails?.titulo || t('loading')}
          </h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <ResultsPageActions
          examDetails={examDetails}
          resultados={resultados}
          totalPreguntas={totalPreguntas}
          selectedGroupId={selectedGroupId}
          onExportExcel={handleExportToExcel}
        />
      </div>

      {/* Cards grid */}
      {examDetails && (
        <div className="flex flex-col sm:flex-row gap-4">
          <ExamDetailsCard examDetails={examDetails} />
          <StatisticsCard resultados={resultados} todosEstudiantes={todosEstudiantes} />
        </div>
      )}

      {/* Question Analysis Card (NEW) */}
      <QuestionAnalysisCard resultados={resultados} totalPreguntas={totalPreguntas} />

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
