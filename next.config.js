/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['i.pravatar.cc', 'placehold.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Don't try to statically optimize everything
  output: 'standalone',
  // Optimize for production
  productionBrowserSourceMaps: false,
  // Optimize chunk loading
  webpack: (config, { isServer, dev }) => {
    // Only apply in client-side production builds
    if (!isServer && !dev) {
      // Increase timeout for chunk loading (helpful for slower mobile connections)
      config.output.chunkLoadTimeout = 60000; // 60 seconds

      // Optimize chunk size for better mobile performance
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /[\\/]node_modules[\\/](@next|next|react|react-dom)[\\/]/,
            priority: 40,
            enforce: true,
            reuseExistingChunk: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            name(module) {
              // Safer way to extract package name that handles edge cases
              const packageNameMatch = module.context && module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              if (packageNameMatch && packageNameMatch[1]) {
                return `npm.${packageNameMatch[1].replace('@', '')}`;
              }
              return 'vendors'; // Fallback name
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
          shared: {
            name(module, chunks) {
              if (!chunks || chunks.length === 0) {
                return 'shared';
              }
              return `shared-${chunks.map(c => c.name).join('~')}`;
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
      
      // Add a special comment to ensure hot module replacement works correctly with chunks
      config.output.hotUpdateMainFilename = 'static/webpack/[id].[fullhash].hot-update.json';
    }

    return config;
  },
}

module.exports = nextConfig 