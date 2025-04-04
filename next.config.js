/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    // Disable image optimization as it may be causing issues with local files
    unoptimized: true,
  },
  // Configure production build
  distDir: 'build',
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  productionBrowserSourceMaps: false,
  
  // Skip static generation for API routes and handle them as server-side only
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    // Enable dynamic runtime for all API routes
    appDir: true,
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  
  // Exclude specific routes from static generation
  excludeDefaultMomentLocales: true,
  poweredByHeader: false,
  
  webpack: (config, { isServer, dev }) => {
    // Only apply in client-side production builds
    if (!isServer && !dev) {
      config.output.chunkLoadTimeout = 120000; // Increased to 120 seconds
      
      // Simplified chunk splitting for better compatibility
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 10,
        minSize: 0,
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](@next|next|react|react-dom)[\\/]/,
            priority: 40,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          }
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig 