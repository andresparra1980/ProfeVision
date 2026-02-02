import { useOnboarding } from '@/lib/contexts/onboarding-context';
import { FloatingActionButton } from '../ui/floating-action-button';
import { ScanWizard } from './scan-wizard';

interface ScanExamFeatureProps {
  hideForWelcome?: boolean;
}

export function ScanExamFeature({ hideForWelcome = false }: ScanExamFeatureProps) {
  const { isScanWizardOpen, setScanWizardOpen } = useOnboarding();

  const openWizard = () => {
    setScanWizardOpen(true);
  };

  const closeWizard = () => {
    setScanWizardOpen(false);
  };

  return (
    <>
      {!isScanWizardOpen && <FloatingActionButton onClick={openWizard} hideForWelcome={hideForWelcome} />}
      <ScanWizard isOpen={isScanWizardOpen} onClose={closeWizard} />
    </>
  );
} 