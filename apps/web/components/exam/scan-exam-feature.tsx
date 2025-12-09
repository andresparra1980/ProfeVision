import { useState } from 'react';
import { FloatingActionButton } from '../ui/floating-action-button';
import { ScanWizard } from './scan-wizard';

interface ScanExamFeatureProps {
  hideForWelcome?: boolean;
}

export function ScanExamFeature({ hideForWelcome = false }: ScanExamFeatureProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const openWizard = () => {
    setIsWizardOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
  };

  return (
    <>
      {!isWizardOpen && <FloatingActionButton onClick={openWizard} hideForWelcome={hideForWelcome} />}
      <ScanWizard isOpen={isWizardOpen} onClose={closeWizard} />
    </>
  );
} 