import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import Image from 'next/image';
import { LexicalRenderer } from '../lexical-renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@profevision/ui/card';

interface CardBlockProps {
    title?: string;
    content?: SerializedEditorState;
    media?: {
        url?: string;
        alt?: string;
    } | null;
    variant?: string;
}

const variantClasses: Record<string, string> = {
    default: '',
    outline: 'border-2',
    filled: 'bg-muted',
    elevated: 'shadow-lg',
};

export function CardBlockRenderer({ title, content, media, variant = 'default' }: CardBlockProps) {
    return (
        <Card className={`my-6 ${variantClasses[variant] || ''}`}>
            {media?.url && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <Image
                        src={media.url}
                        alt={media.alt || title || 'Card image'}
                        fill
                        className="object-cover"
                    />
                </div>
            )}
            <CardHeader>
                {title && <CardTitle>{title}</CardTitle>}
            </CardHeader>
            <CardContent>
                {content && <LexicalRenderer content={content} />}
            </CardContent>
        </Card>
    );
}
