/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Required for Payload CMS
        reactCompiler: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.profevision.com',
                pathname: '/**',
            },
        ],
    },
    // Transpile shared packages
    transpilePackages: ['@profevision/styles', '@profevision/ui'],
};

export default nextConfig;
