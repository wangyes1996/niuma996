import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    // 禁用TypeScript类型检查
    ignoreBuildErrors: true,
  },
  rewrites: async () => {
    // 检查是否启用代理（仅开发环境）
    if (process.env.NODE_ENV === 'development' && process.env.PROXY_ENABLED === 'true') {
      return [
        {
          source: process.env.PROXY_PATH || '/api/:path*',
          destination: `${process.env.PROXY_TARGET || 'http://localhost:8000'}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
