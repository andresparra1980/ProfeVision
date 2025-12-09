import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from 'next/font/google';

// Main UI font
export const ibmPlexSans = IBM_Plex_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Inter font for logo/branding
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Monospace font for data/numbers
export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Helper function to get monospace class
export const monoFont = ibmPlexMono.className;

// Helper function to get Inter class for logo/branding
export const logoFont = inter.className;
