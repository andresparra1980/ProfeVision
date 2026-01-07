'use client';

import { useTranslations } from 'next-intl';

export function PrivacyContent() {
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
            <h1 className="text-4xl font-bold tracking-tight mb-8">{t('privacy.title')}</h1>
            <p className="text-lg text-muted-foreground mb-8">{t('privacy.effective')}</p>
            
            <div className="bg-card rounded-lg p-6 border mb-8">
              <p className="text-base leading-relaxed">
                {t('privacy.intro')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section1.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('privacy.section1.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section2.title')}</h2>
              <p className="text-base leading-relaxed mb-4">{t('privacy.section2.intro')}</p>
              
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-3">{t('privacy.section2.accountInfo.title')}</h3>
                  <ul className="space-y-2 list-disc list-inside text-sm">
                    {(t.raw('privacy.section2.accountInfo.items') as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-3">{t('privacy.section2.userInfo.title')}</h3>
                  <ul className="space-y-2 list-disc list-inside text-sm">
                    {(t.raw('privacy.section2.userInfo.items') as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section3.title')}</h2>
              <p className="text-base leading-relaxed mb-4">{t('privacy.section3.intro')}</p>
              <ul className="space-y-2 list-disc list-inside text-sm ml-4">
                {(t.raw('privacy.section3.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('privacy.section3.note')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section4.title')}</h2>
              <p className="text-base leading-relaxed mb-4">{t('privacy.section4.intro')}</p>
              <ul className="space-y-3 text-sm">
                {(t.raw('privacy.section4.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <div>{item}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section5.title')}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(t.raw('privacy.section5.items') as string[]).map((item, index) => (
                  <div key={index} className="bg-card border rounded-lg p-4">
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section6.title')}</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3 text-blue-800 dark:text-blue-200">{t('privacy.section6.answer')}</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {(t.raw('privacy.section6.items') as string[]).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section7.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('privacy.section7.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section8.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('privacy.section8.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section9.title')}</h2>
              <p className="text-base leading-relaxed">
                {t('privacy.section9.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('privacy.section10.title')}</h2>
              <div className="bg-card border rounded-lg p-6">
                <p className="text-base leading-relaxed mb-4">
                  {t('privacy.section10.content')}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{t('privacy.section10.address.name')}</p>
                  <p>{t('privacy.section10.address.line1')}</p>
                  <p>{t('privacy.section10.address.line2')}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 