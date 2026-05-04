import type { NextConfig } from "next";
import { redirectAliases } from "./src/lib/routes";

const normalizeBackendUrl = (url: string) => url.replace(/\/+$/, "");

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://127.0.0.1:4010";

const proxyBackendUrl = normalizeBackendUrl(
  process.env.NEXT_PUBLIC_BACKEND_PROXY_URL ??
    process.env.BACKEND_PROXY_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    backendUrl
);

const nextConfig: NextConfig = {
  async redirects() {
    return [...redirectAliases];
  },
  async rewrites() {
    return [
      {
        source: "/public/uploads/:path*",
        destination: `${proxyBackendUrl}/uploads/:path*`,
      },
      {
        source: "/public/:path*",
        destination: "/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${proxyBackendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${proxyBackendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
