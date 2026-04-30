// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow longer function execution for Sheets latency
  experimental: {
    serverActions: { bodySizeLimit: '2mb' }
  },
};

export default nextConfig;
