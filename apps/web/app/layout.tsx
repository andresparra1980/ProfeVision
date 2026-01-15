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
        <script
          id="hydration-monitor"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var originalConsoleError = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  var msg = args[0];
                  var isHydrationError = typeof msg === 'string' && (
                    msg.includes('Minified React error #418') ||
                    msg.includes('Minified React error #423') ||
                    msg.includes('Hydration failed')
                  );
                  if (isHydrationError) {
                    originalConsoleError.apply(console, ['🚨 EARLY HYDRATION ERROR:', args]);
                    // Store in global var for later inspection if needed
                    window._hydrationErrors = window._hydrationErrors || [];
                    window._hydrationErrors.push(args);
                  }
                  originalConsoleError.apply(console, args);
                };
                window.addEventListener('error', function(event) {
                  if (event.message && (
                    event.message.includes('Minified React error #418') || 
                    event.message.includes('#418')
                  )) {
                    console.error('🚨 WINDOW HYDRATION ERROR:', event.message);
                  }
                });
              })();
            `
          }}
        />
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