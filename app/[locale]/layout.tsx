import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/components/shared/auth-provider';
import { ClientLayout } from '@/components/shared/client-layout';
import { CookieBanner } from '@/components/shared/cookie-banner';
import Script from 'next/script';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: string }
}): Promise<Metadata> {
  // Fallback metadata for when translations are not available
  const fallbackMetadata = {
    title: {
      default: params.locale === 'en' 
        ? 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI'
        : 'ProfeVisión - La Mejor Aplicación para Escanear y Calificar Exámenes en Papel con IA',
      template: params.locale === 'en' ? '%s | ProfeVision' : '%s | ProfeVisión'
    },
    description: params.locale === 'en'
      ? "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education. Sign up for free!"
      : "ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes, ahorra tiempo y mejora la educación de tus estudiantes. ¡Resgistrate gratis!",
    keywords: params.locale === 'en' 
      ? [
          'scan exams',
          'grade exams',
          'OMR',
          'optical recognition',
          'automatic correction',
          'artificial intelligence education',
          'exam management',
          'educational application',
          'teachers',
          'student evaluation',
          'mobile correction',
          'computer vision',
          'educational automation'
        ]
      : [
          'escanear exámenes',
          'calificar exámenes',
          'OMR',
          'reconocimiento óptico',
          'corrección automática',
          'inteligencia artificial educación',
          'gestión de exámenes',
          'aplicación educativa',
          'profesores',
          'evaluación estudiantil',
          'corrección con celular',
          'visión artificial',
          'automatización educativa'
        ],
    alternates: {
      canonical: `/${params.locale}`,
      languages: {
        'es-ES': '/es',
        'es': '/',
        'en': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: params.locale === 'en' ? 'en_US' : 'es_ES',
      url: `https://www.profevision.com/${params.locale}`,
      title: params.locale === 'en' 
        ? 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI'
        : 'ProfeVisión - La Mejor Aplicación para Escanear y Calificar Exámenes en Papel con IA',
      description: params.locale === 'en'
        ? "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education. Sign up for free!"
        : "ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes, ahorra tiempo y mejora la educación de tus estudiantes. ¡Resgistrate gratis!",
      siteName: params.locale === 'en' ? 'ProfeVision' : 'ProfeVisión',
      images: [
        {
          url: '/android-chrome-512x512.png',
          width: 512,
          height: 512,
          alt: params.locale === 'en' ? 'ProfeVision - App to Scan and Grade Exams' : 'ProfeVisión - Aplicación para Escanear y Calificar Exámenes',
        }
      ],
    },
  };

  return fallbackMetadata;
}


export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5SFVLZMG');
          `,
        }}
      />
      {/* Schema.org structured data */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": locale === 'en' ? "ProfeVision" : "ProfeVisión",
            "description": locale === 'en' 
              ? "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education."
              : "ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes, ahorra tiempo y mejora la educación de tus estudiantes.",
            "url": `https://www.profevision.com/${locale}`,
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1000"
            },
            "author": {
              "@type": "Organization",
              "name": locale === 'en' ? "ProfeVision Team" : "ProfeVisión Team"
            }
          })
        }}
      />
      
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-5SFVLZMG"
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
            <CookieBanner />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 