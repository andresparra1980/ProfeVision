'use client';

import { RichText, LinkJSXConverter } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical';

// Import block renderers directly
import { ColumnsBlockRenderer } from './blocks/columns-renderer';
import { HeroBlockRenderer } from './blocks/hero-renderer';
import { CardBlockRenderer } from './blocks/card-renderer';
import { ContainerBlockRenderer } from './blocks/container-renderer';
import { SpacerBlockRenderer } from './blocks/spacer-renderer';
import { CodeRenderer } from './blocks/code-renderer';

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

// Custom JSX converters for rendering all content types including blocks
const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({ internalDocToHref }),
    blocks: {
        ...defaultConverters.blocks,
        columns: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as {
                columns?: Array<{
                    width?: string;
                    content?: SerializedEditorState;
                }>;
                gap?: string;
                verticalAlign?: string;
            };
            return <ColumnsBlockRenderer columns={fields.columns || []} gap={fields.gap} verticalAlign={fields.verticalAlign} />;
        },
        hero: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as {
                media?: { url?: string; alt?: string } | null;
                heading?: string;
                content?: SerializedEditorState;
                alignment?: string;
                overlayOpacity?: string;
                height?: string;
            };
            return <HeroBlockRenderer media={fields.media} heading={fields.heading} content={fields.content} alignment={fields.alignment} overlayOpacity={fields.overlayOpacity} height={fields.height} />;
        },
        card: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as {
                title?: string;
                content?: SerializedEditorState;
                media?: { url?: string; alt?: string } | null;
                variant?: string;
            };
            return <CardBlockRenderer title={fields.title} content={fields.content} media={fields.media} variant={fields.variant} />;
        },
        code: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as {
                code?: string;
                language?: string;
                showLineNumbers?: boolean;
                filename?: string;
                highlightLines?: string;
            };
            return (
                <CodeRenderer
                    code={fields.code || ''}
                    language={fields.language || 'typescript'}
                    showLineNumbers={fields.showLineNumbers ?? true}
                    filename={fields.filename}
                    highlightLines={fields.highlightLines}
                />
            );
        },
        container: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as {
                content?: SerializedEditorState;
                backgroundColor?: string;
                padding?: string;
                borderRadius?: string;
                border?: boolean;
                maxWidth?: string;
            };
            return <ContainerBlockRenderer content={fields.content} backgroundColor={fields.backgroundColor} padding={fields.padding} borderRadius={fields.borderRadius} border={fields.border} maxWidth={fields.maxWidth} />;
        },
        spacer: ({ node }: { node: SerializedBlockNode }) => {
            const fields = node.fields as { height?: string };
            return <SpacerBlockRenderer height={fields.height} />;
        },
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
