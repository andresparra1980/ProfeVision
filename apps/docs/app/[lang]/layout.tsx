import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { I18nProvider } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';
import type { ReactNode } from 'react';

const translations = {
  es: {
    search: 'Buscar',
    searchNoResult: 'No se encontraron resultados',
    toc: 'En esta pagina',
    tocNoHeadings: 'Sin encabezados',
    lastUpdate: 'Ultima actualizacion',
    chooseLanguage: 'Idioma',
    nextPage: 'Siguiente',
    previousPage: 'Anterior',
    chooseTheme: 'Tema',
  },
  en: {
    search: 'Search',
    searchNoResult: 'No results found',
    toc: 'On this page',
    tocNoHeadings: 'No headings',
    lastUpdate: 'Last updated',
    chooseLanguage: 'Language',
    nextPage: 'Next',
    previousPage: 'Previous',
    chooseTheme: 'Theme',
  },
};

const locales = [
  { locale: 'es', name: 'Espanol' },
  { locale: 'en', name: 'English' },
];

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <I18nProvider
          locale={lang}
          locales={locales}
          translations={translations[lang as keyof typeof translations]}
        >
          <RootProvider>{children}</RootProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
