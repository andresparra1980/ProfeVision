interface SpacerBlockProps {
    height?: string;
}

const heightClasses: Record<string, string> = {
    xs: 'h-4',
    small: 'h-6',
    medium: 'h-10',
    large: 'h-16',
    xlarge: 'h-24',
};

export function SpacerBlockRenderer({ height = 'medium' }: SpacerBlockProps) {
    const heightClass = heightClasses[height] || heightClasses.medium;
    
    return <div className={heightClass} />;
}
