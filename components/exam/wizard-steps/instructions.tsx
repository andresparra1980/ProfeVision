import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { UsageData } from "@/lib/hooks/useTierLimits";
import { AlertCircle } from "lucide-react";

interface InstructionsProps {
  onNext: () => void;
  scanUsage?: UsageData;
  canScan?: boolean;
}

export function Instructions({ onNext, scanUsage, canScan = true }: InstructionsProps) {
  const t = useTranslations('wizard-step-instructions');
  const tTiers = useTranslations('tiers');

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-center">{t('title')}</h2>

      {/* Indicador de uso de escaneos */}
      {scanUsage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <UsageIndicator
            label={tTiers('features.scans')}
            used={scanUsage.used}
            limit={scanUsage.limit}
            warningThreshold={80}
          />
        </div>
      )}

      {/* Warning si no puede escanear */}
      {!canScan && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-200">
            <p className="font-semibold mb-1">{tTiers('limits.reached.title')}</p>
            <p>{tTiers('limits.reached.scans')}</p>
          </div>
        </div>
      )}

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">{t('subtitle')}</h3>
        <p className="text-amber-700 mb-4">
          {t('description')}
        </p>
        <ul className="space-y-2 text-amber-700 list-disc pl-5">
          <li>{t('steps.0')}</li>
          <li>{t('steps.1')}</li>
          <li>{t('steps.2')}</li>
          <li>{t('steps.3')}</li>
        </ul>
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-primary"
        disabled={!canScan}
      >
        {t('button.continue')}
      </Button>
    </div>
  );
} 