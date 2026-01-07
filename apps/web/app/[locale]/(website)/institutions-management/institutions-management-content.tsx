'use client';

import { useTranslations } from 'next-intl';

export function InstitutionsManagementPageContent() {
  const t = useTranslations('common');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('institutionsManagement.title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('institutionsManagement.subtitle')}
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">{t('institutionsManagement.mainFeatures.title')}</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t('institutionsManagement.mainFeatures.item1')}</li>
              <li>• {t('institutionsManagement.mainFeatures.item2')}</li>
              <li>• {t('institutionsManagement.mainFeatures.item3')}</li>
              <li>• {t('institutionsManagement.mainFeatures.item4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
