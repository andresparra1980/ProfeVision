import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { LexicalRenderer } from '../lexical-renderer';

interface HeroBlockProps {
    media?: {
        url?: string;
        alt?: string;
    } | null;
    heading?: string;
    content?: SerializedEditorState;
    alignment?: string;
    overlayOpacity?: string;
    height?: string;
}

const alignmentClasses: Record<string, string> = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
};

const heightClasses: Record<string, string> = {
    small: 'min-h-[300px]',
    medium: 'min-h-[500px]',
    large: 'min-h-[700px]',
    fullscreen: 'min-h-screen',
};

export function HeroBlockRenderer({ media, heading, content, alignment = 'center', overlayOpacity = '50', height = 'medium' }: HeroBlockProps) {
    if (!media?.url) return null;

    const overlayOpacityValue = parseInt(overlayOpacity) / 100;

    return (
        <div className={`relative ${heightClasses[height] || 'min-h-[500px]'} flex items-center justify-center overflow-hidden rounded-lg my-8`}>
            {/* Background Image */}
            <img
                src={media.url}
                alt={media.alt || heading || 'Hero image'}
                className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: overlayOpacityValue }}
            />
            
            {/* Content */}
            <div className={`relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col ${alignmentClasses[alignment] || 'text-center items-center'}`}>
                {heading && (
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        {heading}
                    </h2>
                )}
                {content && (
                    <div className="prose prose-lg [&_p]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_a]:text-white [&_strong]:text-white [&_em]:text-white [&_li]:text-white [&_blockquote]:text-white [&_blockquote]:border-white/30">
                        <LexicalRenderer content={content} />
                    </div>
                )}
            </div>
        </div>
    );
}
