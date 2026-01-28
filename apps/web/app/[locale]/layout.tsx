import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/components/shared/auth-provider';
import { ClientLayout } from '@/components/shared/client-layout';

import { OrganizationSchema, WebSiteSchema } from '@/components/seo/json-ld';
import { CookieBanner } from '@/components/shared/cookie-banner';
import { GoogleTagManager } from '@next/third-parties/google';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const BASE_URL = 'https://profevision.com';

type LocaleMetadata = {
  title: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  ogLocale: string;
  imageAlt: string;
};

const metadataByLocale: Record<string, LocaleMetadata> = {
  en: {
    title: 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI',
    titleTemplate: '%s',
    description: "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education. Sign up for free!",
    keywords: ['scan exams', 'grade exams', 'OMR', 'optical recognition', 'automatic correction', 'artificial intelligence education', 'exam management', 'educational application', 'teachers', 'student evaluation', 'mobile correction', 'computer vision', 'educational automation'],
    ogLocale: 'en_US',
    imageAlt: 'ProfeVision - App to Scan and Grade Exams',
  },
  es: {
    title: 'ProfeVisión - La Mejor Aplicación para Escanear y Calificar Exámenes en Papel con IA',
    titleTemplate: '%s',
    description: 'ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes, ahorra tiempo y mejora la educación de tus estudiantes. ¡Regístrate gratis!',
    keywords: ['escanear exámenes', 'calificar exámenes', 'OMR', 'reconocimiento óptico', 'corrección automática', 'inteligencia artificial educación', 'gestión de exámenes', 'aplicación educativa', 'profesores', 'evaluación estudiantil', 'corrección con celular', 'visión artificial', 'automatización educativa'],
    ogLocale: 'es_ES',
    imageAlt: 'ProfeVisión - Aplicación para Escanear y Calificar Exámenes',
  },
  fr: {
    title: 'ProfeVision - La Meilleure Application pour Scanner et Noter les Examens Papier avec IA',
    titleTemplate: '%s',
    description: "ProfeVision, la meilleure application pour scanner et noter les examens papier avec l'IA. Automatisez la création, la correction et la gestion des examens, gagnez du temps et améliorez l'éducation de vos élèves. Inscrivez-vous gratuitement!",
    keywords: ['scanner examens', 'noter examens', 'OMR', 'reconnaissance optique', 'correction automatique', 'intelligence artificielle éducation', 'gestion examens', 'application éducative', 'enseignants', 'évaluation étudiants', 'correction mobile', 'vision artificielle', 'automatisation éducative'],
    ogLocale: 'fr_FR',
    imageAlt: 'ProfeVision - Application pour Scanner et Noter les Examens',
  },
  pt: {
    title: 'ProfeVision - O Melhor Aplicativo para Escanear e Corrigir Provas em Papel com IA',
    titleTemplate: '%s',
    description: 'ProfeVision, o melhor aplicativo para escanear e corrigir provas em papel com IA. Automatize a criação, correção e gestão de provas, economize tempo e melhore a educação dos seus alunos. Cadastre-se grátis!',
    keywords: ['escanear provas', 'corrigir provas', 'OMR', 'reconhecimento óptico', 'correção automática', 'inteligência artificial educação', 'gestão de provas', 'aplicativo educacional', 'professores', 'avaliação estudantes', 'correção móvel', 'visão artificial', 'automação educacional'],
    ogLocale: 'pt_BR',
    imageAlt: 'ProfeVision - Aplicativo para Escanear e Corrigir Provas',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = metadataByLocale[locale] || metadataByLocale.en;

  return {
    title: {
      default: meta.title,
      template: meta.titleTemplate,
    },
    description: meta.description,
    keywords: meta.keywords,
    // NOTE: alternates (canonical/hreflang) are NOT defined here
    // Each page defines its own via generatePageMetadata() in lib/seo/page-metadata.ts
    // Defining them here would override page-specific canonicals, causing SEO issues
    openGraph: {
      type: 'website',
      locale: meta.ogLocale,
      url: `${BASE_URL}/${locale}`,
      title: meta.title,
      description: meta.description,
      siteName: 'ProfeVision',
      images: [
        {
          url: `${BASE_URL}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
          alt: meta.imageAlt,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${BASE_URL}/android-chrome-512x512.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}


export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <>
      <GoogleTagManager gtmId="GTM-5SFVLZMG" />
      <OrganizationSchema />
      <WebSiteSchema />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
          <CookieBanner />
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  );
} 