'use client';

import { useTranslations } from 'next-intl';

export function CookiesContent() {
  const t = useTranslations('common');

  return (
    <div className="legal-main bg-background relative overflow-hidden">
      {/* Background gradient - same as hero section */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold tracking-tight mb-8">{t('cookies.title')}</h1>
            
            <div className="bg-card rounded-lg p-6 border mb-8">
              <p className="text-base leading-relaxed">
                {t('cookies.intro')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section1.title')}</h2>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="text-base leading-relaxed mb-4">
                  {t('cookies.section1.content.paragraph1')}
                </p>
                <p className="text-base leading-relaxed mb-4">
                  {t('cookies.section1.content.paragraph2')}
                </p>
                <p className="text-base leading-relaxed">
                  {t('cookies.section1.content.paragraph3')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section2.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('cookies.section2.intro')}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">{t('cookies.section2.functions.title')}</h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {(t.raw('cookies.section2.functions.items') as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('cookies.section2.notWhat.title')}</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {(t.raw('cookies.section2.notWhat.items') as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section3.title')}</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-3">{t('cookies.section3.byEntity.title')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byEntity.own')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byEntity.ownDescription')}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byEntity.thirdParty')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byEntity.thirdPartyDescription')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t('cookies.section3.byEntity.note')}</p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-3">{t('cookies.section3.byPurpose.title')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byPurpose.technical')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byPurpose.technicalDescription')}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byPurpose.personalization')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byPurpose.personalizationDescription')}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byPurpose.analysis')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byPurpose.analysisDescription')}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byPurpose.advertising')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byPurpose.advertisingDescription')}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">{t('cookies.section3.byPurpose.behavioral')}</td>
                          <td className="px-4 py-3 text-sm">{t('cookies.section3.byPurpose.behavioralDescription')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-3">{t('cookies.section3.byDuration.title')}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{t('cookies.section3.byDuration.session')}</h4>
                      <p className="text-sm text-muted-foreground">{t('cookies.section3.byDuration.sessionDescription')}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{t('cookies.section3.byDuration.persistent')}</h4>
                      <p className="text-sm text-muted-foreground">{t('cookies.section3.byDuration.persistentDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section4.title')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('cookies.section4.table.name')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('cookies.section4.table.provider')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('cookies.section4.table.description')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('cookies.section4.table.duration')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('cookies.section4.table.type')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(t.raw('cookies.section4.cookies') as Array<{name: string, provider: string, description: string, duration: string, type: string}>).map((cookie, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-mono text-sm">{cookie.name}</td>
                        <td className="px-4 py-3 text-sm">{cookie.provider}</td>
                        <td className="px-4 py-3 text-sm">{cookie.description}</td>
                        <td className="px-4 py-3 text-sm">{cookie.duration}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            cookie.type === 'Analítica' || cookie.type === 'Analytics' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                          }`}>
                            {cookie.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section5.title')}</h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <p className="text-yellow-800 dark:text-yellow-200 mb-4 font-medium">
                  {t('cookies.section5.warning')}
                </p>
                <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                  {(t.raw('cookies.section5.consequences') as string[]).map((consequence, index) => (
                    <li key={index}>• {consequence}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section6.title')}</h2>
              <p className="text-base leading-relaxed mb-4">
                {t('cookies.section6.intro')}
              </p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Chrome</h4>
                  <a 
                    href="https://support.google.com/chrome/answer/95647?hl=en&co=GENIE.Platform%3DDesktop" 
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                  >
                    {t('cookies.section6.browsers.chrome')}
                  </a>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Firefox</h4>
                  <a 
                    href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" 
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                  >
                    {t('cookies.section6.browsers.firefox')}
                  </a>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Safari</h4>
                  <a 
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" 
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                  >
                    {t('cookies.section6.browsers.safari')}
                  </a>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Microsoft Edge</h4>
                  <a 
                    href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d" 
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                  >
                    {t('cookies.section6.browsers.edge')}
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section7.title')}</h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-red-700 dark:text-red-300 mb-4">
                  <strong>{t('cookies.section7.important')}</strong> {t('cookies.section7.warning')}
                </p>
                <p className="text-red-700 dark:text-red-300">
                  {t('cookies.section7.responsibility')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.section8.title')}</h2>
              <div className="bg-card border rounded-lg p-6">
                <p className="text-base leading-relaxed">
                  {t('cookies.section8.content')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 
