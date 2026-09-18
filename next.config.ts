import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SPORTS_WEEK_BUILD_DIR || ".next",
  reactStrictMode: true,
};

export default nextConfig;
