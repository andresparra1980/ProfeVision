import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Estudiante } from '../utils/types';

interface UseManualGradeProps {
  examId: string | string[];
  onGradeSaved: () => Promise<void>;
}

export function useManualGrade({ examId, onGradeSaved }: UseManualGradeProps) {
  const t = useTranslations('dashboard.exams.results');
  const tc = useTranslations('common');
  const [showManualGradeDialog, setShowManualGradeDialog] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);
  const [manualGrade, setManualGrade] = useState<string>('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const handleShowManualGradeDialog = (estudiante: Estudiante) => {
    setSelectedEstudiante(estudiante);
    setManualGrade('');
    setShowManualGradeDialog(true);
  };

  const handleSaveManualGrade = async () => {
    if (!selectedEstudiante || !manualGrade) return;

    try {
      setIsSubmittingGrade(true);

      const gradeValue = parseFloat(manualGrade);

      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        toast.error(tc('messages.error'), {
          description: t('toast.gradeValidationError'),
        });
        return;
      }

      const examIdString = typeof examId === 'string' ? examId : Array.isArray(examId) ? examId[0] : '';

      const response = await fetch(`/api/exams/${examIdString}/manual-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estudianteId: selectedEstudiante.id,
          puntaje: gradeValue,
        }),
      });

      if (!response.ok) {
        const _error = await response.json();
        throw new Error(_error.error || 'Error al guardar la calificación');
      }

      // Refrescar los resultados
      await onGradeSaved();

      toast.success(t('toast.gradeSaved'), {
        description: t('toast.gradeSavedDesc'),
      });

      setShowManualGradeDialog(false);

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(t('toast.saveError'), {
          description: String(error.message) || t('toast.saveErrorDesc'),
        });
      } else {
        toast.error(t('toast.saveError'), {
          description: t('toast.saveErrorDesc'),
        });
      }
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  return {
    showManualGradeDialog,
    setShowManualGradeDialog,
    selectedEstudiante,
    manualGrade,
    setManualGrade,
    isSubmittingGrade,
    handleShowManualGradeDialog,
    handleSaveManualGrade,
  };
}
