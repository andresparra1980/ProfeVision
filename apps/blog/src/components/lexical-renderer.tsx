'use client';

import { RichText, LinkJSXConverter } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

// Custom converter for internal document links
const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
    const doc = linkNode.fields.doc;
    if (!doc) return '/';
    
    const { relationTo, value } = doc;
    if (typeof value !== 'object' || !value) {
        return '/';
    }
    const slug = (value as { slug?: string }).slug || '';

    switch (relationTo) {
        case 'blog_posts':
            return `/posts/${slug}`;
        case 'blog_categories':
            return `/categories/${slug}`;
        case 'blog_authors':
            return `/authors/${slug}`;
        default:
            return `/${relationTo}/${slug}`;
    }
};

// Custom JSX converters for rendering all content types
const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({ internalDocToHref }),
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
