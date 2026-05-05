const normalizeBackendUrl = (url) => url.replace(/\/+$/, "");

const backendUrl = normalizeBackendUrl(
  process.env.BACKEND_PROXY_URL ??
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://127.0.0.1:4010"
);

/** @type {import("next").NextConfig} */
const nextConfig = {
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
      { source: "/criar-conta.html", destination: "/auth/criar-conta", permanent: true },
      { source: "/auth/criar-conta.html", destination: "/auth/criar-conta", permanent: true },
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
