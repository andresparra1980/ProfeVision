import '@profevision/styles/globals.css';
import type { Metadata } from 'next';
import { ibmPlexSans, ibmPlexMono } from '@profevision/styles/fonts';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
    title: {
        default: 'ProfeVision Blog',
        template: '%s | ProfeVision Blog',
    },
    description: 'Artículos y recursos sobre educación, tecnología y evaluación con IA.',
    metadataBase: new URL('https://blog.profevision.com'),
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body
                className={`min-h-screen bg-background font-sans antialiased ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
