import { ThemeProvider } from 'next-themes';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function FrontendLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1 pt-16">
                    {children}
                </main>
                <SiteFooter />
            </div>
        </ThemeProvider>
    );
}
