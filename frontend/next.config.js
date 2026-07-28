const normalizeBackendUrl = (url) => url.replace(/\/+$/, "");

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

const isProduction = process.env.NODE_ENV === "production";
const backendOrigin = (() => {
  try {
    return new URL(backendUrl).origin;
  } catch {
    return "";
  }
})();

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
      backendOrigin,
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
      backendOrigin,
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.clarity.ms",
    ],
    ["media-src", "'self'", "blob:", backendOrigin],
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
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    // Uploads administrativos passam pelo rewrite /api antes de chegar ao backend.
    // O backend aceita vídeos de até 64 MB; reservamos margem para o multipart.
    proxyClientMaxBodySize: "70mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...cmsPreviewPaths.map((source) => ({
        source,
        has: cmsPreviewQuery,
        headers: cmsPreviewHeaders,
      })),
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/inicio", destination: "/", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/sobre.html", destination: "/sobre", permanent: true },
      { source: "/institucional", destination: "/sobre", permanent: true },
      { source: "/empresa", destination: "/sobre", permanent: true },
      { source: "/quem-somos", destination: "/sobre", permanent: true },
      { source: "/servicos.html", destination: "/servicos", permanent: true },
      { source: "/transportes", destination: "/servicos", permanent: true },
      { source: "/nossos-servicos", destination: "/servicos", permanent: true },
      { source: "/fale-conosco.html", destination: "/fale-conosco", permanent: true },
      { source: "/contato", destination: "/fale-conosco", permanent: true },
      { source: "/contact", destination: "/fale-conosco", permanent: true },
      { source: "/cotacao.html", destination: "/cotacao", permanent: true },
      { source: "/quote", destination: "/cotacao", permanent: true },
      { source: "/orcamento", destination: "/cotacao", permanent: true },
      { source: "/trabalhe-conosco.html", destination: "/trabalhe-conosco", permanent: true },
      { source: "/careers", destination: "/trabalhe-conosco", permanent: true },
      { source: "/vagas", destination: "/trabalhe-conosco", permanent: true },
      { source: "/central-ajuda.html", destination: "/central-ajuda", permanent: true },
      { source: "/ajuda", destination: "/central-ajuda", permanent: true },
      { source: "/help", destination: "/central-ajuda", permanent: true },
      { source: "/faq", destination: "/central-ajuda", permanent: true },
      { source: "/imprensa.html", destination: "/imprensa", permanent: true },
      { source: "/press", destination: "/imprensa", permanent: true },
      { source: "/midia", destination: "/imprensa", permanent: true },
      { source: "/para-empresas.html", destination: "/para-empresas", permanent: true },
      { source: "/empresas", destination: "/para-empresas", permanent: true },
      { source: "/b2b", destination: "/para-empresas", permanent: true },
      { source: "/termos-de-uso.html", destination: "/termos-de-uso", permanent: true },
      { source: "/termos", destination: "/termos-de-uso", permanent: true },
      { source: "/politica-de-privacidade", destination: "/privacidade", permanent: true },
      { source: "/politica", destination: "/privacidade", permanent: true },
      { source: "/sua-voz.html", destination: "/sua-voz", permanent: true },
      { source: "/canal-de-denuncias", destination: "/sua-voz", permanent: true },
      { source: "/entrar.html", destination: "/auth/entrar", permanent: true },
      { source: "/auth/entrar.html", destination: "/auth/entrar", permanent: true },
      { source: "/criar-conta.html", destination: "/auth/entrar", permanent: true },
      { source: "/auth/criar-conta.html", destination: "/auth/entrar", permanent: true },
      { source: "/admin", destination: "/developer", permanent: true },
      { source: "/developer/index.html", destination: "/developer", permanent: true },
      {
        source: "/rastrear-encomenda",
        destination: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
        permanent: false,
      },
    ];
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

module.exports = nextConfig;
