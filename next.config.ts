import type { NextConfig } from "next";

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

  transpilePackages: ["@react-pdf/renderer"],

  // Turbopack configuration (stable in Next.js 15+)
  turbopack: {
    resolveAlias: {
      // Handle browser-incompatible packages
      canvas: "./lib/empty-module.js",
      pdfkit: "./lib/empty-module.js",
    },
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

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

export default nextConfig;
