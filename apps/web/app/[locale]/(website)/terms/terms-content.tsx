'use client';

import { useTranslations } from 'next-intl';

export function TermsContent() {
  const t = useTranslations('common');

  return (
    <div className="legal-main bg-background relative overflow-hidden">
      {/* Background gradient - same as hero section */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10">
        <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold tracking-tight mb-8">{t('terms.title')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('terms.effective')}</p>
            
            <div className="bg-card rounded-lg p-6 border mb-8">
              <p className="text-base leading-relaxed">
                {t('terms.intro')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section1.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('terms.section1.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section2.title')}</h2>
              <ul className="space-y-2 list-disc list-inside text-base">
                {(t.raw('terms.section2.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section3.title')}</h2>
              <p className="text-base leading-relaxed mb-4">{t('terms.section3.intro')}</p>
              <div className="bg-muted/50 rounded-lg p-6">
                <ul className="space-y-3 text-sm">
                  {(t.raw('terms.section3.items') as string[]).map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className={`w-2 h-2 ${index === 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full mt-2 flex-shrink-0`}></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {t('terms.section3.warning')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section4.title')}</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
                    {(t.raw('terms.section4.items') as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('terms.section4.privacyLink')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section5.title')}</h2>
              <p className="text-base leading-relaxed mb-4">{t('terms.section5.intro')}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {(t.raw('terms.section5.items') as string[]).map((item, index) => (
                  <div key={index} className="bg-card border rounded-lg p-4">
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-teal-900 dark:text-teal-100 font-medium">
                  <strong>{t('terms.noteLabel')}</strong> {t('terms.section5.note')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section6.title')}</h2>
              <div className="bg-muted/50 rounded-lg p-6">
                <ul className="space-y-2 text-sm list-disc list-inside">
                  {(t.raw('terms.section6.items') as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section7.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('terms.section7.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section8.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('terms.section8.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section9.title')}</h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {(t.raw('terms.section9.items') as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section10.title')}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(t.raw('terms.section10.items') as string[]).map((item, index) => (
                  <div key={index} className="bg-card border rounded-lg p-4">
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section11.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('terms.section11.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section12.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('terms.section12.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section13.title')}</h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {t('terms.section13.content')}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {t('terms.section13.note')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section14.title')}</h2>
              <ul className="space-y-2 list-disc list-inside text-base">
                {(t.raw('terms.section14.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('terms.section15.title')}</h2>
              <div className="bg-card border rounded-lg p-6">
                <p className="text-base leading-relaxed mb-4">
                  {t('terms.section15.intro')}
                </p>
                <p className="text-base mb-2">
                  <a href="mailto:info@profevision.com" className="text-primary hover:underline font-medium">
                    info@profevision.com
                  </a>
                </p>
                <p className="text-base mb-4">{t('terms.section15.orAddress')}</p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{t('terms.section15.address.name')}</p>
                  <p>{t('terms.section15.address.line1')}</p>
                  <p>{t('terms.section15.address.line2')}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 
