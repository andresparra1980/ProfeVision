import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ConfirmationProps {
  onScanAnother: () => void;
  onFinish: () => void;
}

export function Confirmation({ onScanAnother, onFinish }: ConfirmationProps) {
  const t = useTranslations('wizard-step-confirmation');
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle className="h-24 w-24 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-green-700">{t('title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('description')}
        </p>
      </div>
      
      <div className="flex space-x-6 mt-8">
        <Button 
          variant="outline"
          size="lg"
          onClick={onScanAnother}
          className="text-base px-8"
        >
          {t('buttons.scanAnother')}
        </Button>
        
        <Button 
          variant="default"
          size="lg"
          onClick={onFinish}
          className="text-base px-8 bg-primary"
        >
          {t('buttons.finish')}
        </Button>
      </div>
    </div>
  );
} 