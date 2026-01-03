'use client';

import { LanguageSwitcherDropdownSuspense } from './language-switcher-dropdown';

interface LanguageSwitcherDashboardProps {
  collapsed?: boolean;
}

export function LanguageSwitcherDashboard({ collapsed = false }: LanguageSwitcherDashboardProps) {
  // El parámetro collapsed se mantiene para compatibilidad hacia atrás
  // showLabel muestra/oculta el label según el estado
  // withTooltip muestra tooltip cuando está colapsado
  return (
    <div className="py-3 px-2 flex items-center justify-center w-full">
      <LanguageSwitcherDropdownSuspense
        variant="outline"
        size="sm"
        showLabel={!collapsed}
        withTooltip={collapsed}
        tooltipSide="right"
      />
    </div>
  );
}
