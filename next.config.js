/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode in development for demo purposes
  reactStrictMode: false,
  
  // Enable image optimization from external sources if needed
  images: {
    domains: [],
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
};

module.exports = nextConfig;
