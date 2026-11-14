import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@estudio/db", "@estudio/video", "remotion", "@remotion/player"],
  serverExternalPackages: ["better-sqlite3"],
  experimental: { serverActions: { bodySizeLimit: "30mb" } },
};
export default config;
