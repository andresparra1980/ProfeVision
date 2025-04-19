import { useState, useCallback } from 'react';
import { FloatingActionButton } from '../ui/floating-action-button';
import { ScanWizard } from './scan-wizard';

export function ScanExamFeature() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const openWizard = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
  }, []);

  return (
    <>
      {!isWizardOpen && <FloatingActionButton onClick={openWizard} />}
      {isWizardOpen && <ScanWizard isOpen={isWizardOpen} onClose={closeWizard} />}
    </>
  );
} 