import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Crear plugin de next-intl
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Disable strict mode in development for demo purposes
  reactStrictMode: false,

  // Enable image optimization from external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yotzyxxwdzayehazvomi.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/9.x/avataaars/svg",
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  // Ensure trailing slashes are handled properly
  trailingSlash: false,

  // Configure redirects if needed
  async redirects() {
    return [
      // Force apex domain (redirect www to apex)
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.profevision.com' },
        ],
        destination: 'https://profevision.com/:path*',
        permanent: true,
      },
    ];
  },

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
        // Cache opencv.js for 1 year (it's versioned and rarely changes)
        source: '/opencv.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Prevent caching of HTML or anything else
        source:
          '/((?!_next/static|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // Explicitly enabling App Router is not necessary in Next.js 14+

  transpilePackages: ["@react-pdf/renderer"],

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      pdfkit: false,
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

export default withNextIntl(nextConfig);
