'use server';

import { codeToHtml } from 'shiki';
import { transformerNotationHighlight, transformerNotationDiff } from '@shikijs/transformers';
import type { CodeBlock } from '@/payload-types';

interface CodeBlockProps {
    code: string;
    language: string;
    showLineNumbers: boolean;
    filename?: string;
    highlightLines?: string;
}

export async function CodeRenderer({ 
    code, 
    language, 
    showLineNumbers, 
    filename,
    highlightLines 
}: CodeBlockProps) {
    const transformers = [
        transformerNotationHighlight(),
        transformerNotationDiff(),
    ];

    const html = await codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
        transformers,
    });

    return (
        <div className="my-6 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
            {filename && (
                <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-4 py-2">
                    <span className="text-sm font-medium text-gray-300">{filename}</span>
                    <span className="text-xs text-gray-500 uppercase">{language}</span>
                </div>
            )}
            <div 
                className="overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}
