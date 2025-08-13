import { useTranslations } from "next-intl";

interface DevelopmentOverlayProps {
  children: React.ReactNode;
  className?: string;
}

export function DevelopmentOverlay({ children, className = "" }: DevelopmentOverlayProps) {
  const t = useTranslations('common');
  return (
    <div className={`relative ${className}`}>
      {/* Contenido con blur */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay con mensaje */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center p-4">
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('developmentOverlay.message')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 