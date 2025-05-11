/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add support for WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Support NodeJS modules in the browser
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...(config.resolve?.fallback || {}),
        fs: false,
        path: false,
        os: false,
      },
    };
    
    return config;
  },
  
  // Add headers required for SharedArrayBuffer (WASM threading)
  async headers() {
    return [
      {
        // Headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 