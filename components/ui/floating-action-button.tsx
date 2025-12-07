'use client';

import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useOnboarding } from '@/lib/contexts/onboarding-context';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

interface FloatingActionButtonProps {
  onClick: () => void;
  hideForWelcome?: boolean;
}

export function FloatingActionButton({ onClick, hideForWelcome = false }: FloatingActionButtonProps) {
  const { isOpen } = useSidebar();
  const { shouldShowWizard } = useOnboarding();
  const t = useTranslations('floating-action-button');
  const pathname = usePathname();

  // Mostrar solo en rutas top de dashboard:
  // - /dashboard
  // - /dashboard/* (exactamente un segmento después de "dashboard", p.ej. /dashboard/exams)
  // - /[locale]/dashboard y /[locale]/dashboard/* con la misma regla
  const segments = pathname.split('/').filter(Boolean);
  const dashIndex = segments.indexOf('dashboard');
  const isInDashboard = dashIndex !== -1;
  const depthAfterDashboard = isInDashboard ? segments.length - (dashIndex + 1) : 0;
  const isTopDashboardSection = isInDashboard && depthAfterDashboard <= 1;

  // No mostrar la bottom bar si el sidebar está abierto en mobile
  if (isOpen) {
    return null;
  }

  // Ocultar cuando no estemos en dashboard o cuando haya más de un nivel de profundidad
  if (!isTopDashboardSection) {
    return null;
  }

  // Ocultar durante onboarding wizard o welcome modal
  if (shouldShowWizard || hideForWelcome) {
    return null;
  }

  return (
    // Bottom bar fija para mobile, oculta en desktop
    <div className="fixed bottom-0 left-0 w-full bg-background/50 backdrop-blur-sm border-t border-border shadow-lg md:hidden z-40">
      <div className="flex justify-center py-4 px-4 safe-area-pb">
        <Button
          onClick={onClick}
          className="h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center gap-2 px-6 font-medium"
        >
          <Camera className="h-5 w-5" />
          {t('label')}
        </Button>
      </div>
    </div>
  );
} 