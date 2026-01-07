'use client';

import { useTranslations } from 'next-intl';

export function BlogContent() {
  const t = useTranslations('blog');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('description')}
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">{t('comingSoon.title')}</h2>
            <p className="text-muted-foreground">
              {t('comingSoon.description')}
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>• {t('comingSoon.items.0')}</li>
              <li>• {t('comingSoon.items.1')}</li>
              <li>• {t('comingSoon.items.2')}</li>
              <li>• {t('comingSoon.items.3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 