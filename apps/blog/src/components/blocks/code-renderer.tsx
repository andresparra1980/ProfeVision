'use client';

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

    useEffect(() => {
        let mounted = true;
        
        async function highlight() {
            const transformers = [
                transformerNotationHighlight(),
                transformerNotationDiff(),
            ];

            const highlighted = await codeToHtml(code, {
                lang: language,
                theme: 'github-dark',
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
    }, [code, language]);

    return (
        <div className="my-6 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
            {filename && (
                <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-4 py-2">
                    <span className="text-sm font-medium text-gray-300">{filename}</span>
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
