import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Self-contained server build used by the Dockerfile; Vercel ignores it.
    output: 'standalone',
};

export default nextConfig;
