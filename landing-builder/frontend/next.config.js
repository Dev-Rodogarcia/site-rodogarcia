const backendUrl = (process.env.LANDING_BUILDER_BACKEND_URL ?? "http://127.0.0.1:36110").replace(/\/+$/, "");
const isProduction = process.env.NODE_ENV === "production";
const nextBuildDistDir = process.env.NEXT_BUILD_DIST_DIR?.trim() || ".next";
if (![".next", ".next.test"].includes(nextBuildDistDir)) {
  throw new Error("NEXT_BUILD_DIST_DIR deve ser .next ou .next.test.");
}
const assetPrefix = (() => {
  const value = (process.env.LANDING_BUILDER_ASSET_PREFIX ?? "/landing-assets")
    .trim()
    .replace(/\/+$/, "");
  return value.startsWith("/") && !value.startsWith("//") && value.length > 1
    ? value
    : "/landing-assets";
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    !isProduction ? "'unsafe-eval'" : "",
    "https://www.googletagmanager.com",
  ].filter(Boolean).join(" "),
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com",
  "media-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: nextBuildDistDir,
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  assetPrefix,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: `${assetPrefix}/_next/:path*`, destination: "/_next/:path*" },
      ],
      afterFiles: [
        { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
        { source: "/landing-media/:path*", destination: `${backendUrl}/landing-media/:path*` },
      ],
    };
  },
};

module.exports = nextConfig;
