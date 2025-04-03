/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode in development for demo purposes
  reactStrictMode: false,
  
  // Enable image optimization from external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yotzyxxwdzayehazvomi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  
  // Ensure trailing slashes are handled properly
  trailingSlash: false,
  
  // Configure redirects if needed
  async redirects() {
    return [];
  },
  
  // Configure custom headers if needed
  async headers() {
    return [];
  },

  // Explicitly enabling App Router is not necessary in Next.js 14+

  transpilePackages: ['@react-pdf/renderer'],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
      'pdfkit': false,
    };

    // Agregar fallbacks para módulos de Node
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Excluir opencv-js del bundle del servidor
    if (isServer) {
      config.externals = [...(config.externals || []), "@techstark/opencv-js"];
    }

    return config;
  },
};

module.exports = nextConfig;
