import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import { ibmPlexSans, ibmPlexMono } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ProfeVisión - La Mejor Aplicación para Escanear y Calificar Exámenes en Papel con IA',
    template: '%s | ProfeVisión'
  },
  description: 'ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes, ahorra tiempo y mejora la educación de tus estudiantes. ¡Resgistrate gratis!',
  metadataBase: new URL('https://profevision.com'),
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/es',
      'es': '/',
      'en': '/en',
    },
  },
};

// 🔐 Layout raíz simplificado para callbacks de Supabase y rutas no localizadas
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🌍 Detectar locale desde middleware para SEO correcto
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'es';
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        suppressHydrationWarning
      >
        {gtmId && (
          <>
            <Script
              id="gtm"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://profevision.com/gtm?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                `,
              }}
            />
            <noscript>
              <iframe
                src={`https://profevision.com/gtmns?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}
        {children}
      </body>
    </html>
  );
} 