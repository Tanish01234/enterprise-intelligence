/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ei/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'echarts'],
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig