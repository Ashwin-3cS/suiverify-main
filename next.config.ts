import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // Add webpack config for fallback when not using Turbopack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
