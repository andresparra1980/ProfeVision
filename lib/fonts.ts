import { IBM_Plex_Mono, Inter } from 'next/font/google';

// Main UI font
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Monospace font for data/numbers
export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

// Helper function to get monospace class
export const monoFont = ibmPlexMono.className;
