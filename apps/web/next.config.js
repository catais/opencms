/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@opencms/database",
    "@opencms/auth",
    "@opencms/ui",
    "@opencms/api",
    "@opencms/core",
    "@opencms/plugins",
    "@opencms/themes",
    "@opencms/utils"
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
