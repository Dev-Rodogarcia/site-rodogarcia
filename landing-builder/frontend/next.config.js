const backendUrl = (process.env.LANDING_BUILDER_BACKEND_URL ?? "http://127.0.0.1:6110").replace(/\/+$/, "");

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

module.exports = nextConfig;
