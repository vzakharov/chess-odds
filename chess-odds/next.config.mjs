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
};

export default nextConfig; 