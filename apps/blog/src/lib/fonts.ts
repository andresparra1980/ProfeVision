import { Inter } from 'next/font/google';

// Inter font for logo/branding (header, footer logos only)
export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

// Helper function to get Inter class for logo/branding
export const logoFont = inter.className;
