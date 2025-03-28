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
  },
  // Don't try to statically optimize everything
  output: 'standalone',
  // Optimize for production
  productionBrowserSourceMaps: false,
  // Simplified webpack config
  webpack: (config, { isServer, dev }) => {
    // Only apply in client-side production builds
    if (!isServer && !dev) {
      // Increase timeout for chunk loading (helpful for slower mobile connections)
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