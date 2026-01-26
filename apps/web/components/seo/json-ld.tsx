import Script from 'next/script';

interface JsonLdProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
    id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
    return (
        <Script
            id={id || `json-ld-${data['@type']}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            strategy="afterInteractive"
        />
    );
}

export function FAQSchema({ data }: { data: { question: string; answer: string }[] }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return <JsonLd data={schema} />;
}

export function OrganizationSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ProfeVision',
        url: 'https://profevision.com',
        logo: 'https://assets.profevision.com/android-chrome-512x512.png',
        sameAs: [],
    };

    return <JsonLd data={schema} />;
}

export function WebSiteSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ProfeVision',
        url: 'https://profevision.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://profevision.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    return <JsonLd data={schema} />;
}

interface SoftwareAppProps {
    name: string;
    description: string;
    applicationCategory?: string;
    operatingSystem?: string;
}

export function SoftwareApplicationSchema({
    name,
    description,
    applicationCategory = 'EducationalApplication',
    operatingSystem = 'Android, iOS, Windows, macOS, Linux',
}: SoftwareAppProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name,
        description,
        applicationCategory,
        operatingSystem,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
    };

    return <JsonLd data={schema} />;
}
