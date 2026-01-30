import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { LexicalRenderer } from '../lexical-renderer';

interface ColumnsBlockProps {
    columns?: Array<{
        width?: string;
        content?: SerializedEditorState;
    }>;
    gap?: string;
    verticalAlign?: string;
}

const gapClasses: Record<string, string> = {
    none: 'gap-0',
    small: 'gap-4',
    medium: 'gap-6',
    large: 'gap-8',
};

const widthClasses: Record<string, string> = {
    equal: 'flex-1',
    oneThird: 'md:w-1/3',
    twoThirds: 'md:w-2/3',
    oneQuarter: 'md:w-1/4',
    threeQuarters: 'md:w-3/4',
};

const verticalAlignClasses: Record<string, string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
};

export function ColumnsBlockRenderer({ columns, gap = 'medium', verticalAlign = 'top' }: ColumnsBlockProps) {
    if (!columns || columns.length === 0) return null;

    return (
        <div className={`grid grid-cols-1 md:grid-cols-${columns.length} ${gapClasses[gap] || 'gap-6'} ${verticalAlignClasses[verticalAlign] || 'items-start'}`}>
            {columns.map((column, index) => (
                <div key={index} className={widthClasses[column.width || 'equal']}>
                    {column.content && <LexicalRenderer content={column.content} />}
                </div>
            ))}
        </div>
    );
}
