import type { NextConfig } from "next";
import { redirectAliases } from "./src/lib/routes";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://127.0.0.1:4010";

const nextConfig: NextConfig = {
  async redirects() {
    return [...redirectAliases];
  },
  async rewrites() {
    return [
      {
        source: "/public/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/public/:path*",
        destination: "/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
