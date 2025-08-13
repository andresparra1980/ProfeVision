'use client';

import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('common');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('contact.title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('contact.subtitle')}
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.info.title')}</h2>
              <div className="space-y-3">
                <div>
                  <strong>{t('contact.info.email')}</strong> info@profevision.com
                </div>
                <div>
                  <strong>{t('contact.info.phone')}</strong> +1 (555) 123-4567
                </div>
                <div>
                  <strong>{t('contact.info.schedule')}</strong> {t('contact.info.scheduleHours')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.support.title')}</h2>
              <div className="space-y-3">
                <div>
                  <strong>{t('contact.support.email')}</strong> soporte@profevision.com
                </div>
                <div>
                  <strong>{t('contact.support.liveChat')}</strong> {t('contact.support.liveChatAvailable')}
                </div>
                <div>
                  <strong>{t('contact.support.knowledge')}</strong> {t('contact.support.knowledgeBase')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 