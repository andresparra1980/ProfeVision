import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ClientLayout } from '@/components/shared/client-layout';
import { AuthProvider } from '@/components/shared/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProfeVision - Plataforma de Evaluación Educativa',
  description: 'Crea, administra y califica exámenes de forma eficiente con ProfeVision',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.className}`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 