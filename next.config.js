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
  
  // Increase timeout to avoid build issues
  staticPageGenerationTimeout: 300,
  
  productionBrowserSourceMaps: false,
  
  // Configuration for API routes
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  
  // Exclude specific routes from static generation
  excludeDefaultMomentLocales: true,
  poweredByHeader: false,
  
  // Add headers to fix router state issues
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, x-nextjs-data',
          }
        ],
      },
    ];
  },
  
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