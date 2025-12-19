'use client';

import { LanguageSwitcherDropdown } from './language-switcher-dropdown';

// Este componente es ahora un alias al nuevo componente LanguageSwitcherDropdown
// Se mantiene para compatibilidad hacia atrás

export function LanguageSwitcher() {
  return (
    <>
      {/* Desktop version with tooltip */}
      <div className="hidden md:block">
        <LanguageSwitcherDropdown variant="outline" size="sm" withTooltip tooltipSide="bottom" />
      </div>
      {/* Mobile version without tooltip */}
      <div className="md:hidden">
        <LanguageSwitcherDropdown variant="outline" size="sm" />
      </div>
    </>
  );
} 