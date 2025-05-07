"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

// Add a component to handle theme initialization
function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useNextTheme();

  React.useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // If no theme is set in localStorage
      if (!localStorage.getItem('theme')) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        // Set the actual theme value instead of 'system'
        setTheme(systemTheme);
        localStorage.setItem('theme', systemTheme);
        // Update the class on html element
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      }
    }
  }, [setTheme]);

  return <>{children}</>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeInitializer>
        {children}
      </ThemeInitializer>
    </NextThemesProvider>
  );
}