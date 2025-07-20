import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

interface InstructionsProps {
  onNext: () => void;
}

export function Instructions({ onNext }: InstructionsProps) {
  const t = useTranslations('wizard-step-instructions');
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-center">{t('title')}</h2>
      
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
      >
        {t('button.continue')}
      </Button>
    </div>
  );
} 