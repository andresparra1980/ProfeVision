'use client';

import { RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

// Custom JSX converters for rendering special blocks
const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    // Handle upload blocks (images embedded in rich text)
    blocks: {
        ...defaultConverters.blocks,
    },
});

interface LexicalRendererProps {
    content: SerializedEditorState | null | undefined;
}

export function LexicalRenderer({ content }: LexicalRendererProps) {
    if (!content) {
        return <p className="text-muted-foreground">No content available.</p>;
    }

    return (
        <RichText
            data={content}
            converters={jsxConverters}
            className="prose prose-lg dark:prose-invert max-w-none"
        />
    );
}
