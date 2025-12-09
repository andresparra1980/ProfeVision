import { useState } from 'react';
import type { GrupoExamen } from '../utils/types';
import { DEBUG } from '../utils/constants';

interface UseGroupSelectionProps {
  examId: string | string[];
  availableGroups: GrupoExamen[];
  selectedGroupId: string | null;
  onGroupChange: (_groupId: string) => void;
  setLoading: (_loading: boolean) => void;
}

export function useGroupSelection({
  examId,
  availableGroups,
  selectedGroupId,
  onGroupChange,
  setLoading,
}: UseGroupSelectionProps) {
  const [showGroupSelectionModal, setShowGroupSelectionModal] = useState(false);

  const handleGroupSelect = (grupoId: string) => {
    // Solo tomar acción si el grupo seleccionado es diferente al actual
    if (grupoId !== selectedGroupId) {
      // Cerrar el modal primero
      setShowGroupSelectionModal(false);

      // Actualizar la UI para mostrar que estamos cargando
      setLoading(true);

      // Guardar el grupo seleccionado en localStorage
      try {
        const examIdString = typeof examId === 'string' ? examId : Array.isArray(examId) ? examId[0] : '';
        localStorage.setItem(`exam_${examIdString}_selected_group`, grupoId);
      } catch (_error) {
        // Manejar el error silenciosamente
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
      }

      // Llamar a onGroupChange con el nuevo ID de grupo
      onGroupChange(grupoId);
    } else {
      // Si es el mismo grupo, solo cerrar el modal
      setShowGroupSelectionModal(false);
    }
  };

  const handleToggleGroupSelectionModal = () => {
    setShowGroupSelectionModal(prev => !prev);
  };

  // Manejar el cierre del modal con X
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      // Si se cierra y no hay grupo seleccionado pero hay grupos disponibles
      if (!selectedGroupId && availableGroups.length > 0) {
        const defaultGroupId = availableGroups[0].grupo_id;
        // Actualizar la UI para mostrar que estamos cargando
        setLoading(true);

        // Llamar a onGroupChange con el grupo por defecto
        onGroupChange(defaultGroupId);
      }
    }
    setShowGroupSelectionModal(open);
  };

  return {
    showGroupSelectionModal,
    setShowGroupSelectionModal,
    handleGroupSelect,
    handleToggleGroupSelectionModal,
    handleModalOpenChange,
  };
}
