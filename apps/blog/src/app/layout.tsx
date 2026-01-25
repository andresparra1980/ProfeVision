import '@profevision/styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'ProfeVision Blog',
        template: '%s | ProfeVision Blog',
    },
    description: 'Artículos y recursos sobre educación, tecnología y evaluación con IA.',
    metadataBase: new URL('https://blog.profevision.com'),
};

// Root layout - provides minimal html/body shell
// Next.js requires these tags in the root layout
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
