'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';
import { transformerNotationHighlight, transformerNotationDiff } from '@shikijs/transformers';

interface CodeBlockProps {
    code: string;
    language: string;
    showLineNumbers: boolean;
    filename?: string;
    highlightLines?: string;
}

export function CodeRenderer({
    code,
    language,
    showLineNumbers,
    filename,
    highlightLines
}: CodeBlockProps) {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        let mounted = true;

        async function highlight() {
            const transformers = [
                transformerNotationHighlight(),
                transformerNotationDiff(),
            ];

            const highlighted = await codeToHtml(code, {
                lang: language,
                theme: resolvedTheme === 'dark' ? 'vitesse-dark' : 'vitesse-light',
                transformers,
            });

            if (mounted) {
                setHtml(highlighted);
                setLoading(false);
            }
        }

        highlight();

        return () => {
            mounted = false;
        };
    }, [code, language, resolvedTheme]);

    return (
        <div className="!my-0 overflow-hidden rounded-lg border border-border bg-[#eff1f5] text-sm dark:bg-[#1e1e2e] [&_pre]:!m-0">
            {filename && (
                <div className="flex items-center justify-between border-b border-border/50 bg-[#e6e9ef] px-4 py-2 dark:bg-[#181825]">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filename}</span>
                    <span className="text-xs text-gray-500 uppercase">{language}</span>
                </div>
            )}
            {loading ? (
                <div className="p-4 text-gray-500">
                    <pre className="font-mono text-sm"><code>{code}</code></pre>
                </div>
            ) : (
                <div
                    className="overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </div>
    );
}
