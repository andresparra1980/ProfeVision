import { useState } from 'react';
import { FloatingActionButton } from '../ui/floating-action-button';
import { ScanWizard } from './scan-wizard';

export function ScanExamFeature() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const openWizard = () => {
    setIsWizardOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
  };

  return (
    <>
      <FloatingActionButton onClick={openWizard} />
      <ScanWizard isOpen={isWizardOpen} onClose={closeWizard} />
    </>
  );
} 