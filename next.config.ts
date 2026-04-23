import type { NextConfig } from "next";
import { redirectAliases } from "./src/lib/routes";

const nextConfig: NextConfig = {
  async redirects() {
    return [...redirectAliases];
  },
};

export default nextConfig;
