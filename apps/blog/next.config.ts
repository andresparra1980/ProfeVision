import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Required for Payload CMS
        reactCompiler: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https' as const,
                hostname: 'assets.profevision.com',
                pathname: '/**',
            },
        ],
    },
    // Transpile shared packages
    transpilePackages: ['@profevision/styles', '@profevision/ui'],
};

export default withNextIntl(nextConfig);

