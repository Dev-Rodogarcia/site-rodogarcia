import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchLanding } from "@/lib/landing";
import { LandingAnalytics } from "@/components/LandingAnalytics";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const landing = await fetchLanding((await params).slug);
  if (!landing) return {};
  return { title: landing.hero.title, description: landing.hero.description, robots: { index: true, follow: true } };
}

export default async function LandingPageRoute({ params }: PageProps) {
  const landing = await fetchLanding((await params).slug);
  if (!landing) notFound();
  const { theme } = landing;
  const font = theme.font === "space-grotesk" ? "Arial, sans-serif" : theme.font === "plus-jakarta" ? "Verdana, sans-serif" : "system-ui, sans-serif";
  const hasBackgroundImage = Boolean(landing.hero.backgroundImage);
  const heroTextColor = hasBackgroundImage ? "#ffffff" : theme.textColor;
  const mutedHeroText = hasBackgroundImage ? "rgba(255,255,255,.88)" : theme.textColor;
  return (
    <main style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: font }}>
      <LandingAnalytics measurementId={landing.analytics.ga4MeasurementId} />
      <section style={{ minHeight: "68vh", color: heroTextColor, background: hasBackgroundImage ? theme.primaryColor : theme.backgroundColor, backgroundImage: hasBackgroundImage ? `linear-gradient(90deg, rgba(4,11,25,.86), rgba(4,11,25,.2)), url(${landing.hero.backgroundImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center", padding: "0 max(24px, 8vw) 72px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "13px 0", fontSize: 14, borderBottom: `1px solid ${hasBackgroundImage ? "rgba(255,255,255,.18)" : "rgba(17,17,17,.16)"}` }}><span>{landing.hero.phone}</span><span>{landing.hero.email}</span></div>
        <div style={{ minHeight: "56vh", display: "grid", alignContent: "center" }}>
          {landing.hero.logo ? <img src={landing.hero.logo} alt={landing.name} style={{ width: 210, maxWidth: "60%", marginBottom: 48 }} /> : <strong style={{ fontSize: 26, letterSpacing: ".06em", marginBottom: 48 }}>SUA LOGO</strong>}
          <div style={{ maxWidth: 760 }}>
          {landing.hero.eyebrow ? <p style={{ textTransform: "uppercase", letterSpacing: ".16em", fontSize: 12, fontWeight: 700 }}>{landing.hero.eyebrow}</p> : null}
          <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)", lineHeight: .95, margin: "18px 0" }}>{landing.hero.title}</h1>
          <p style={{ maxWidth: 620, fontSize: "clamp(1rem, 2vw, 1.25rem)", lineHeight: 1.65, color: mutedHeroText }}>{landing.hero.description}</p>
            {landing.hero.ctaLabel && landing.hero.ctaUrl ? <a href={landing.hero.ctaUrl} style={{ display: "inline-block", marginTop: 28, padding: "14px 22px", borderRadius: 8, background: theme.primaryColor, color: theme.backgroundColor, fontWeight: 700 }}>{landing.hero.ctaLabel}</a> : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 34, maxWidth: 1000 }}>{landing.hero.highlights.map((item, index) => <article key={`${item.title}-${index}`} style={{ padding: 18, border: `1px solid ${hasBackgroundImage ? "rgba(255,255,255,.56)" : "rgba(17,17,17,.2)"}`, borderRadius: 10, background: hasBackgroundImage ? "rgba(8,16,28,.5)" : theme.backgroundColor, backdropFilter: hasBackgroundImage ? "blur(8px)" : undefined }}><strong>{item.title}</strong><p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.45, color: mutedHeroText }}>{item.description}</p></article>)}</div>
        </div>
      </section>
      <section style={{ padding: "84px max(24px, 8vw)", maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ color: theme.primaryColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12 }}>Em construção</p>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.75rem)", maxWidth: 850, margin: "16px 0" }}>{landing.lowerSection.title}</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 760 }}>{landing.lowerSection.description}</p>
        {landing.lowerSection.ctaLabel && landing.lowerSection.ctaUrl ? <a href={landing.lowerSection.ctaUrl} style={{ display: "inline-block", marginTop: 26, padding: "14px 22px", borderRadius: 8, background: theme.primaryColor, color: "#fff", fontWeight: 700 }}>{landing.lowerSection.ctaLabel}</a> : null}
      </section>
      <footer style={{ borderTop: "1px solid color-mix(in srgb, currentColor 16%, transparent)", padding: "28px max(24px, 8vw)", fontSize: 14 }}>Rodogarcia Transportes</footer>
    </main>
  );
}
