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
        hostname: "res.cloudinary.com",          // Cloudinary images
      },
    ],
  },
};

export default nextConfig;
