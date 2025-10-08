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
      <Toaster 
        position="bottom-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            error: 'bg-red-400 text-white border-red-600',
            success: 'bg-green-400 text-white border-green-600',
            warning: 'bg-yellow-400 text-black border-yellow-600',
            info: 'bg-blue-400 text-white border-blue-600',
          },
        }}
      />
    </ThemeProvider>
  );
} 