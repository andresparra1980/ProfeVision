"use client";

import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import { UploadThingProvider } from '@/components/providers/uploadthing-provider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UploadThingProvider>
        {children}
        <Toaster />
        <SonnerToaster />
      </UploadThingProvider>
    </ThemeProvider>
  );
} 