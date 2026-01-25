import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ibmPlexSans, ibmPlexMono } from '@profevision/styles/fonts';
import { ThemeProvider } from 'next-themes';
import type { Metadata } from 'next';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

const BASE_URL = 'https://blog.profevision.com';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        es: 'Blog ProfeVision - Educación, Tecnología e IA',
        en: 'ProfeVision Blog - Education, Technology and AI',
        fr: 'Blog ProfeVision - Éducation, Technologie et IA',
        pt: 'Blog ProfeVision - Educação, Tecnologia e IA',
    };

    const descriptions: Record<string, string> = {
        es: 'Artículos y recursos sobre educación, tecnología y evaluación con IA.',
        en: 'Articles and resources on education, technology, and AI-powered assessment.',
        fr: "Articles et ressources sur l'éducation, la technologie et l'évaluation par IA.",
        pt: 'Artigos e recursos sobre educação, tecnologia e avaliação com IA.',
    };

    return {
        title: {
            default: titles[locale] || titles.es,
            template: `%s | ${titles[locale] || titles.es}`,
        },
        description: descriptions[locale] || descriptions.es,
        openGraph: {
            type: 'website',
            locale,
            url: `${BASE_URL}/${locale}`,
            title: titles[locale] || titles.es,
            description: descriptions[locale] || descriptions.es,
            siteName: 'ProfeVision Blog',
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate locale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <div
            lang={locale}
            className={`min-h-screen bg-background font-sans antialiased ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
        >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </ThemeProvider>
        </div>
    );
}
