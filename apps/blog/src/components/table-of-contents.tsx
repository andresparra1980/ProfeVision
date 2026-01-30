'use client';

import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    locale: string;
}

export function TableOfContents({ locale }: TableOfContentsProps) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    const titleText = locale === 'es' ? 'Contenido' :
        locale === 'en' ? 'Table of Contents' :
            locale === 'fr' ? 'Table des matières' :
                'Índice';

    useEffect(() => {
        // Extract headings from the article content
        const article = document.querySelector('article');
        if (!article) return;

        const headingElements = article.querySelectorAll('h2, h3');
        const extractedHeadings: Heading[] = [];

        headingElements.forEach((heading, index) => {
            // Generate ID if not present
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            extractedHeadings.push({
                id: heading.id,
                text: heading.textContent || '',
                level: parseInt(heading.tagName[1]),
            });
        });

        setHeadings(extractedHeadings);

        // Intersection Observer for active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-100px 0px -60% 0px',
                threshold: 0,
            }
        );

        headingElements.forEach((heading) => observer.observe(heading));

        return () => observer.disconnect();
    }, []);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (headings.length === 0) return null;

    return (
        <nav className="my-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
                {titleText}
            </h3>
            <ul className="space-y-2">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={`${
                            heading.level === 3 ? 'ml-4' : ''
                        }`}
                    >
                        <button
                            onClick={() => scrollToHeading(heading.id)}
                            className={`text-left w-full text-sm hover:text-primary transition-colors ${
                                activeId === heading.id
                                    ? 'text-primary font-medium'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
