'use client';

import { LanguageSwitcherDropdownSuspense } from './language-switcher-dropdown';

// Este componente es ahora un alias al nuevo componente LanguageSwitcherDropdown
// Se mantiene para compatibilidad hacia atrás

export function LanguageSwitcher() {
  return <LanguageSwitcherDropdownSuspense variant="outline" size="sm" />;
} 