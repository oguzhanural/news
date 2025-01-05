/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['img.freepik.com', 'ichef.bbci.co.uk'],
  },
}

module.exports = nextConfig 