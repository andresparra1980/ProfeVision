"use client";

import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import React from 'react';
import { NavigationEventsProvider } from '@/lib/providers/navigation-events-provider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NavigationEventsProvider>
        {children}
        <Toaster />
        <SonnerToaster />
      </NavigationEventsProvider>
    </ThemeProvider>
  );
} 