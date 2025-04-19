"use client";

import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import React, { useEffect } from 'react';
import { setupKeepAlive } from '@/lib/supabase/client';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // Setup keep-alive connection to prevent Supabase connections from going stale
  useEffect(() => {
    const cleanup = setupKeepAlive();
    
    // Cleanup on component unmount
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
      <SonnerToaster />
    </ThemeProvider>
  );
} 