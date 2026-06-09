/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 is a native Node.js module — must not be bundled by webpack.
    // This option is stable in Next.js 15+ as `serverExternalPackages`,
    // but on Next.js 14 it lives under `experimental`.
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
