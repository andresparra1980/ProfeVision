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

// Root layout - minimal shell that just passes children
// Each route group provides its own html/body:
// - (payload) admin routes use Payload's RootLayout
// - [locale] frontend routes use their own layout with html/body
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
