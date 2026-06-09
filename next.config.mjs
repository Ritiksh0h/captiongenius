/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",  // Google user avatars
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",                   // Cloudflare R2 public buckets
      },
    ],
  },
};

export default nextConfig;
