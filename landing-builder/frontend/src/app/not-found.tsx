import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A campanha solicitada não está disponível.",
  robots: { index: false, follow: true },
};

/** O Builder também recebe os caminhos inexistentes do fallback do gateway público. */
export default function NotFound() {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: "32px 20px",
        color: "#f8fafc",
        background: "radial-gradient(circle at 15% 10%, #164e63, transparent 34%), radial-gradient(circle at 85% 85%, #1e3a8a, transparent 36%), #020617",
        textAlign: "center",
      }}
    >
      <section style={{ maxWidth: 640 }}>
        <p style={{ margin: 0, color: "#7dd3fc", fontSize: 13, fontWeight: 800, letterSpacing: "0.18em" }}>ERRO 404</p>
        <h1 style={{ margin: "20px 0 0", fontSize: "clamp(2.4rem, 7vw, 4.8rem)", lineHeight: 0.98 }}>Campanha não encontrada.</h1>
        <p style={{ margin: "22px auto 0", maxWidth: 520, color: "#cbd5e1", fontSize: 17, lineHeight: 1.7 }}>
          Este endereço não corresponde a uma campanha publicada. Você pode retornar ao site institucional.
        </p>
        <a
          href="/"
          style={{
            display: "inline-flex",
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 32,
            padding: "0 24px",
            borderRadius: 999,
            color: "#082f49",
            background: "#7dd3fc",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Voltar ao início
        </a>
      </section>
    </main>
  );
}
