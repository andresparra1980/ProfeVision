import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ibmPlexSans, ibmPlexMono } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI',
    template: '%s | ProfeVision'
  },
  description: "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education. Sign up for free!",
  metadataBase: new URL('https://profevision.com'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/en',
    languages: {
      'en': '/en',
      'es': '/es',
      'fr': '/fr',
      'pt': '/pt',
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
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
} 