"use client";

import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from "sonner";
import React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
} 