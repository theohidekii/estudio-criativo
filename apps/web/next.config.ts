import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@estudio/db"],
  serverExternalPackages: ["better-sqlite3"],
};
export default config;
