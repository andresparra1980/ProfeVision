import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    // Enable compression for all assets
    compress: true,

    experimental: {
        // Required for Payload CMS
        reactCompiler: false,
    },

    // Optimize for production
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https' as const,
                hostname: 'assets.profevision.com',
                pathname: '/**',
            },
        ],
        minimumCacheTTL: 60,
    },

    // Ensure trailing slashes are handled properly
    trailingSlash: false,

    // Transpile shared packages
    transpilePackages: ['@profevision/styles', '@profevision/ui'],

    // Configure custom headers for better caching
    async headers() {
        return [
            {
                // Cache Next.js static assets (fingerprinted / immutable)
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // Cache images only if hashed, otherwise keep short or no cache
                source: '/(.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg))',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=60, must-revalidate',
                    },
                ],
            },
            {
                // Cache public pages (HTML) - Allow caching for 1 hour, stale for 1 minute
                source:
                    '/((?!_next/static|api/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)).*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600, stale-while-revalidate=60',
                    },
                ],
            },
        ];
    },
};

export default withNextIntl(nextConfig);

