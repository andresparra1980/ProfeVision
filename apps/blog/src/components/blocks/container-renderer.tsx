import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { LexicalRenderer } from '../lexical-renderer';

interface ContainerBlockProps {
    content?: SerializedEditorState;
    backgroundColor?: string;
    padding?: string;
    borderRadius?: string;
    border?: boolean;
    maxWidth?: string;
}

const backgroundClasses: Record<string, string> = {
    white: 'bg-background',
    gray100: 'bg-gray-50 dark:bg-gray-900',
    gray200: 'bg-gray-100 dark:bg-gray-800',
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/20',
    dark: 'bg-gray-900 text-white',
};

const paddingClasses: Record<string, string> = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
    xlarge: 'p-12',
};

const borderRadiusClasses: Record<string, string> = {
    none: 'rounded-none',
    small: 'rounded',
    medium: 'rounded-lg',
    large: 'rounded-xl',
};

const maxWidthClasses: Record<string, string> = {
    default: 'w-full',
    narrow: 'max-w-[800px] mx-auto',
    medium: 'max-w-[1000px] mx-auto',
};

export function ContainerBlockRenderer({ 
    content, 
    backgroundColor = 'white', 
    padding = 'medium', 
    borderRadius = 'medium',
    border = false,
    maxWidth = 'default'
}: ContainerBlockProps) {
    const bgClass = backgroundClasses[backgroundColor] || backgroundClasses.white;
    const paddingClass = paddingClasses[padding] || paddingClasses.medium;
    const radiusClass = borderRadiusClasses[borderRadius] || borderRadiusClasses.medium;
    const maxWidthClass = maxWidthClasses[maxWidth] || maxWidthClasses.default;
    const borderClass = border ? 'border border-border' : '';

    return (
        <div className={`${bgClass} ${paddingClass} ${radiusClass} ${maxWidthClass} ${borderClass} my-6`}>
            {content && <LexicalRenderer content={content} />}
        </div>
    );
}
