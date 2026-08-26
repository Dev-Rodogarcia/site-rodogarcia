const path = require("path");
const redirectAliases = require("./src/lib/redirectAliases.json");

const normalizeBackendUrl = (url) => url.replace(/\/+$/, "");
const isProduction = process.env.NODE_ENV === "production";

const firstConfiguredBackendUrl = (...values) =>
  values.find((value) => typeof value === "string" && value.trim())?.trim() ||
  "http://127.0.0.1:6050";

const backendUrl = normalizeBackendUrl(
  firstConfiguredBackendUrl(
    process.env.BACKEND_PROXY_URL,
    process.env.NEXT_PUBLIC_BACKEND_PROXY_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL
  )
);
const cmsInternalUrl = normalizeBackendUrl(
  process.env.CMS_INTERNAL_URL?.trim() ||
    (isProduction ? "http://127.0.0.1:6061" : "http://127.0.0.1:5013")
);
const cmsBackendInternalUrl = normalizeBackendUrl(
  process.env.CMS_BACKEND_INTERNAL_URL?.trim() ||
    (isProduction ? "http://127.0.0.1:6051" : "http://127.0.0.1:4013")
);
const landingBuilderPublicUrl = process.env.LANDING_BUILDER_PUBLIC_URL?.trim().replace(/\/+$/, "") ?? "";
const landingBuilderAssetPrefix = (() => {
  const value = (process.env.LANDING_BUILDER_ASSET_PREFIX ?? "/landing-assets")
    .trim()
    .replace(/\/+$/, "");
  return value.startsWith("/") && !value.startsWith("//") && value.length > 1
    ? value
    : "/landing-assets";
})();
const nextBuildDistDir = process.env.NEXT_BUILD_DIST_DIR?.trim() || ".next";

if (![".next", ".next.test"].includes(nextBuildDistDir)) {
  throw new Error("NEXT_BUILD_DIST_DIR deve ser .next ou .next.test.");
}

function buildContentSecurityPolicy(frameAncestors) {
  return [
    "default-src 'self'",
    [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      isProduction ? "" : "'unsafe-eval'",
      "https://www.googletagmanager.com",
      "https://www.clarity.ms",
    ],
    [
      "connect-src",
      "'self'",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.clarity.ms",
      "https://*.sentry.io",
      "https://viacep.com.br",
    ],
    [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.clarity.ms",
    ],
    ["media-src", "'self'", "blob:"],
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-src 'self'",
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ]
    .map((directive) =>
      Array.isArray(directive)
        ? directive.filter(Boolean).join(" ")
        : directive
    )
    .filter(Boolean)
    .join("; ");
}

function buildSecurityHeaders({ frameAncestors, frameOptions }) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(frameAncestors),
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: frameOptions },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(isProduction
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ]
      : []),
  ];
}

const securityHeaders = buildSecurityHeaders({
  frameAncestors: "'none'",
  frameOptions: "DENY",
});

const cmsPreviewHeaders = buildSecurityHeaders({
  frameAncestors: "'self'",
  frameOptions: "SAMEORIGIN",
});

const cmsPreviewPaths = [
  "/",
  "/servicos",
  "/sobre",
  "/para-empresas",
  "/cotacao",
  "/coletas",
  "/melhoria-continua",
  "/fale-conosco",
  "/central-ajuda",
  "/imprensa",
  "/trabalhe-conosco",
  "/termos-de-uso",
  "/privacidade",
  "/sua-voz",
];

const cmsPreviewQuery = [{ type: "query", key: "preview", value: "cms" }];

/** @type {import("next").NextConfig} */
const nextConfig = {
  // O hardening usa .next.test para não tocar no cache do next dev iniciado
  // manualmente. Em todos os fluxos normais o diretório continua sendo .next.
  distDir: nextBuildDistDir,
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    externalDir: true,
    // Uploads administrativos passam pelo rewrite /api antes de chegar ao backend.
    // O backend aceita vídeos de até 64 MB; reservamos margem para o multipart.
    proxyClientMaxBodySize: "70mb",
  },
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      ...cmsPreviewPaths.map((source) => ({
        source,
        has: cmsPreviewQuery,
        headers: cmsPreviewHeaders,
      })),
    ];
  },
  async redirects() {
    return redirectAliases;
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...(landingBuilderPublicUrl
          ? [
              {
                source: `${landingBuilderAssetPrefix}/_next/:path*`,
                destination: `${landingBuilderPublicUrl}/_next/:path*`,
              },
              {
                source: "/landing-media/:path*",
                destination: `${landingBuilderPublicUrl}/landing-media/:path*`,
              },
            ]
          : []),
        // O CMS é um processo privado. O navegador continua no mesmo hostname público
        // e só conhece o prefixo /admin; a URL interna nunca é exposta ao client.
        {
          source: "/admin",
          destination: `${cmsInternalUrl}/admin`,
        },
        {
          source: "/admin/:path*",
          destination: `${cmsInternalUrl}/admin/:path*`,
        },
        // A API administrativa e os recursos públicos que ela administra formam
        // um único domínio de dados no backend do CMS. Estes rewrites precisam
        // preceder o fallback genérico de /api para o backend institucional.
        {
          source: "/api/auth/:path*",
          destination: `${cmsBackendInternalUrl}/api/auth/:path*`,
        },
        {
          source: "/api/admin/:path*",
          destination: `${cmsBackendInternalUrl}/api/admin/:path*`,
        },
        {
          source: "/api/public/content",
          destination: `${cmsBackendInternalUrl}/api/public/content`,
        },
        {
          source: "/api/public/seo",
          destination: `${cmsBackendInternalUrl}/api/public/seo`,
        },
        {
          source: "/api/public/media-slots",
          destination: `${cmsBackendInternalUrl}/api/public/media-slots`,
        },
        {
          source: "/api/consent-settings",
          destination: `${cmsBackendInternalUrl}/api/consent-settings`,
        },
        {
          source: "/api/consent-events",
          destination: `${cmsBackendInternalUrl}/api/consent-events`,
        },
        {
          source: "/api/tracking/:path*",
          destination: `${cmsBackendInternalUrl}/api/tracking/:path*`,
        },
        {
          source: "/api/analytics/:path*",
          destination: `${cmsBackendInternalUrl}/api/analytics/:path*`,
        },
        {
          source: "/api/popup-config",
          destination: `${cmsBackendInternalUrl}/api/popup-config`,
        },
        {
          source: "/api/popup-events",
          destination: `${cmsBackendInternalUrl}/api/popup-events`,
        },
        {
          source: "/api/leads",
          destination: `${cmsBackendInternalUrl}/api/leads`,
        },
        {
          source: "/api/contact",
          destination: `${cmsBackendInternalUrl}/api/contact`,
        },
        {
          source: "/api/quote",
          destination: `${cmsBackendInternalUrl}/api/quote`,
        },
        {
          source: "/api/improvements",
          destination: `${cmsBackendInternalUrl}/api/improvements`,
        },
        {
          source: "/public/uploads/:path*",
          destination: `${cmsBackendInternalUrl}/uploads/:path*`,
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
          destination: `${cmsBackendInternalUrl}/uploads/:path*`,
        },
      ],
      // Só atende caminhos que o site principal não reconheceu; a URL do visitante
      // permanece no domínio institucional, mas a landing é renderizada pelo projeto isolado.
      fallback: landingBuilderPublicUrl ? [
        { source: "/:path*", destination: `${landingBuilderPublicUrl}/:path*` },
      ] : [],
    };
  },
};

module.exports = nextConfig;
