import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import '@/styles/globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-sans',
  style: ['normal'],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: '500',
  subsets: ['latin'],
  variable: '--font-mono',
});

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
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
} 