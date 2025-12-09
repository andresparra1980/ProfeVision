'use client';

import { useTranslations } from 'next-intl';

export default function MobileAppPage() {
  const t = useTranslations('mobile-app');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('description')}
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">{t('plannedFeatures.title')}</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t('plannedFeatures.items.0')}</li>
              <li>• {t('plannedFeatures.items.1')}</li>
              <li>• {t('plannedFeatures.items.2')}</li>
              <li>• {t('plannedFeatures.items.3')}</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
              {t('inDevelopment')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 