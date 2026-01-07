'use client';

import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';

export function DataDeletionPageContent() {
  const t = useTranslations('common');

  return (
    <div className="legal-main bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10">
        <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold tracking-tight mb-8">{t('dataDeletion.title')}</h1>
            
            <div className="bg-card rounded-lg p-6 border mb-8">
              <p className="text-base leading-relaxed">
                {t('dataDeletion.intro')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('dataDeletion.howTo.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('dataDeletion.howTo.description')}
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <a 
                    href="mailto:deletion@profevision.com" 
                    className="text-xl font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    deletion@profevision.com
                  </a>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('dataDeletion.howTo.emailNote')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('dataDeletion.process.title')}</h2>
              <ul className="space-y-3 text-sm">
                {(t.raw('dataDeletion.process.steps') as string[]).map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="pt-0.5">{step}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('dataDeletion.dataDeleted.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('dataDeletion.dataDeleted.description')}
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm ml-4">
                {(t.raw('dataDeletion.dataDeleted.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2 text-amber-800 dark:text-amber-200">
                  {t('dataDeletion.note.title')}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t('dataDeletion.note.content')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
