import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SPORTS_WEEK_BUILD_DIR || ".next",
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/teams",
        destination: "/sports",
        permanent: true,
      },
      {
        source: "/indoor",
        destination: "/sports",
        permanent: true,
      },
      {
        source: "/outdoor",
        destination: "/sports",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
