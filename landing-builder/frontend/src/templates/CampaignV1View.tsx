import { LandingAnalytics } from "@/components/LandingAnalytics";
import type { PublicLandingPage } from "@/lib/landing";

const fontFamilies = {
  system: "system-ui, sans-serif",
  "space-grotesk": "Arial, sans-serif",
  "plus-jakarta": "Verdana, sans-serif",
} as const;

function Cta({ label, href, color, textColor }: { label: string; href: string; color: string; textColor: string }) {
  if (!label || !href) return null;
  return <a href={href} style={{ display: "inline-block", marginTop: 28, padding: "14px 22px", borderRadius: 999, background: color, color: textColor, fontWeight: 700, textDecoration: "none" }}>{label}</a>;
}

function Eyebrow({ children, color }: { children: string; color: string }) {
  return children ? <p style={{ color, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", fontSize: 12, margin: 0 }}>{children}</p> : null;
}

function SectionTitle({ eyebrow, title, color }: { eyebrow: string; title: string; color: string }) {
  return <><Eyebrow color={color}>{eyebrow}</Eyebrow><h2 style={{ fontSize: "clamp(2rem, 4vw, 3.75rem)", lineHeight: 1, letterSpacing: "-.045em", maxWidth: 850, margin: "16px 0" }}>{title}</h2></>;
}

/** Renderizador público exclusivo do template campaign-v1. */
export function CampaignV1View({ landing, preview = false }: { landing: PublicLandingPage; preview?: boolean }) {
  const { theme } = landing;
  const hasBackgroundImage = Boolean(landing.hero.backgroundImage);
  const heroTextColor = hasBackgroundImage ? "#ffffff" : theme.textColor;
  const mutedHeroText = hasBackgroundImage ? "rgba(255,255,255,.84)" : theme.textColor;
  const contentPadding = "max(24px, 8vw)";
  const border = "1px solid rgba(17,17,17,.14)";

  return <main style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: fontFamilies[theme.font] }}>
    {preview ? null : <LandingAnalytics measurementId={landing.analytics.ga4MeasurementId} />}
    <section style={{ minHeight: "68vh", color: heroTextColor, background: hasBackgroundImage ? theme.primaryColor : theme.backgroundColor, backgroundImage: hasBackgroundImage ? `linear-gradient(90deg, rgba(4,11,25,.86), rgba(4,11,25,.2)), url(${landing.hero.backgroundImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center", padding: `0 ${contentPadding} 72px` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, minHeight: 44, alignItems: "center", padding: "13px 0", fontSize: 14, borderBottom: `1px solid ${hasBackgroundImage ? "rgba(255,255,255,.18)" : "rgba(17,17,17,.16)"}` }}>
        <span>{landing.hero.phone}</span><span>{landing.hero.email}</span>
      </div>
      <div style={{ minHeight: "56vh", display: "grid", alignContent: "center" }}>
        {landing.hero.logo ? <img src={landing.hero.logo} alt={landing.name} style={{ width: 210, maxWidth: "60%", marginBottom: 48 }} /> : <strong style={{ fontSize: 26, letterSpacing: ".06em", marginBottom: 48 }}>SUA LOGO</strong>}
        <div style={{ maxWidth: 760 }}>
          <Eyebrow color={mutedHeroText}>{landing.hero.eyebrow}</Eyebrow>
          <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)", lineHeight: .95, letterSpacing: "-.055em", margin: "18px 0" }}>{landing.hero.title}</h1>
          <p style={{ maxWidth: 620, fontSize: "clamp(1rem, 2vw, 1.25rem)", lineHeight: 1.65, color: mutedHeroText }}>{landing.hero.description}</p>
          <Cta label={landing.hero.ctaLabel} href={landing.hero.ctaUrl} color={theme.primaryColor} textColor={theme.backgroundColor} />
        </div>
        {landing.hero.highlights.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 34, maxWidth: 1000 }}>
          {landing.hero.highlights.map((item, index) => <article key={`${item.title}-${index}`} style={{ padding: 18, border: `1px solid ${hasBackgroundImage ? "rgba(255,255,255,.56)" : "rgba(17,17,17,.2)"}`, borderRadius: 12, background: hasBackgroundImage ? "rgba(8,16,28,.5)" : theme.backgroundColor, backdropFilter: hasBackgroundImage ? "blur(8px)" : undefined }}><strong>{item.title}</strong><p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.45, color: mutedHeroText }}>{item.description}</p></article>)}
        </div> : null}
      </div>
    </section>

    {landing.lowerSection.visible ? <section style={{ padding: `84px ${contentPadding}`, maxWidth: 1280, margin: "0 auto" }}><SectionTitle eyebrow="Apresentação" title={landing.lowerSection.title} color={theme.primaryColor} /><p style={{ fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 760 }}>{landing.lowerSection.description}</p><Cta label={landing.lowerSection.ctaLabel} href={landing.lowerSection.ctaUrl} color={theme.primaryColor} textColor="#fff" /></section> : null}

    {landing.benefits.visible ? <section style={{ padding: `84px ${contentPadding}`, background: "rgba(15,23,42,.045)" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><SectionTitle eyebrow={landing.benefits.eyebrow} title={landing.benefits.title} color={theme.primaryColor} /><p style={{ maxWidth: 720, fontSize: "1.05rem", lineHeight: 1.65 }}>{landing.benefits.description}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 36 }}>{landing.benefits.items.map((item, index) => <article key={`${item.title}-${index}`} style={{ background: theme.backgroundColor, border, borderRadius: 16, padding: 24 }}><strong style={{ fontSize: 18 }}>{item.title}</strong><p style={{ marginBottom: 0, lineHeight: 1.6, opacity: .78 }}>{item.description}</p></article>)}</div></div></section> : null}

    {landing.story.visible ? <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center", padding: `84px ${contentPadding}`, maxWidth: 1280, margin: "0 auto" }}><div>{landing.story.image ? <img src={landing.story.image} alt="Imagem da campanha" style={{ display: "block", width: "100%", minHeight: 320, maxHeight: 540, objectFit: "cover", borderRadius: 18 }} /> : <div style={{ minHeight: 320, borderRadius: 18, background: theme.secondaryColor, opacity: .12 }} />}</div><div><SectionTitle eyebrow={landing.story.eyebrow} title={landing.story.title} color={theme.primaryColor} /><p style={{ fontSize: "1.05rem", lineHeight: 1.7 }}>{landing.story.description}</p><Cta label={landing.story.ctaLabel} href={landing.story.ctaUrl} color={theme.primaryColor} textColor="#fff" /></div></section> : null}

    {landing.metrics.visible ? <section style={{ padding: `72px ${contentPadding}`, background: theme.secondaryColor, color: "#ffffff" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><SectionTitle eyebrow={landing.metrics.eyebrow} title={landing.metrics.title} color="#ffffff" /><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginTop: 34 }}>{landing.metrics.items.map((item, index) => <article key={`${item.value}-${index}`} style={{ borderLeft: "1px solid rgba(255,255,255,.35)", paddingLeft: 18 }}><strong style={{ display: "block", fontSize: "clamp(2.5rem, 5vw, 4.25rem)", lineHeight: 1 }}>{item.value}</strong><span style={{ display: "block", marginTop: 10, opacity: .82 }}>{item.label}</span></article>)}</div></div></section> : null}

    {landing.testimonial.visible ? <section style={{ padding: `96px ${contentPadding}`, maxWidth: 1060, margin: "0 auto", textAlign: "center" }}><Eyebrow color={theme.primaryColor}>{landing.testimonial.eyebrow}</Eyebrow><h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1, letterSpacing: "-.045em", margin: "16px 0 28px" }}>{landing.testimonial.title}</h2><blockquote style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2.25rem)", lineHeight: 1.35, fontWeight: 600 }}>“{landing.testimonial.quote}”</blockquote><p style={{ margin: "28px 0 0", fontWeight: 800 }}>{landing.testimonial.author}</p><p style={{ margin: "6px 0 0", opacity: .7 }}>{landing.testimonial.role}</p></section> : null}

    {landing.faq.visible ? <section style={{ padding: `84px ${contentPadding}`, background: "rgba(15,23,42,.045)" }}><div style={{ maxWidth: 980, margin: "0 auto" }}><SectionTitle eyebrow={landing.faq.eyebrow} title={landing.faq.title} color={theme.primaryColor} /><div style={{ marginTop: 34 }}>{landing.faq.items.map((item, index) => <details key={`${item.question}-${index}`} style={{ borderBottom: border, padding: "20px 0" }}><summary style={{ cursor: "pointer", fontWeight: 800, fontSize: "1.05rem" }}>{item.question}</summary><p style={{ maxWidth: 760, margin: "14px 0 0", lineHeight: 1.65, opacity: .8 }}>{item.answer}</p></details>)}</div></div></section> : null}

    {landing.finalCta.visible ? <section style={{ padding: `92px ${contentPadding}`, background: theme.primaryColor, color: "#ffffff", textAlign: "center" }}><div style={{ maxWidth: 860, margin: "0 auto" }}><Eyebrow color="rgba(255,255,255,.78)">{landing.finalCta.eyebrow}</Eyebrow><h2 style={{ fontSize: "clamp(2.2rem, 5vw, 4.4rem)", lineHeight: .98, letterSpacing: "-.05em", margin: "16px 0" }}>{landing.finalCta.title}</h2><p style={{ fontSize: "1.1rem", lineHeight: 1.7, opacity: .88 }}>{landing.finalCta.description}</p><Cta label={landing.finalCta.ctaLabel} href={landing.finalCta.ctaUrl} color="#ffffff" textColor={theme.primaryColor} /></div></section> : null}

    <footer style={{ padding: `42px ${contentPadding}`, background: theme.secondaryColor, color: "#ffffff" }}><div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 28, maxWidth: 1280, margin: "0 auto" }}><div style={{ maxWidth: 420 }}><strong style={{ fontSize: 20 }}>{landing.footer.brand}</strong><p style={{ lineHeight: 1.6, opacity: .78 }}>{landing.footer.description}</p></div><div style={{ display: "grid", gap: 8, alignContent: "start" }}>{landing.footer.phone ? <a href={`tel:${landing.footer.phone.replace(/[^+\d]/g, "")}`} style={{ color: "inherit" }}>{landing.footer.phone}</a> : null}{landing.footer.email ? <a href={`mailto:${landing.footer.email}`} style={{ color: "inherit" }}>{landing.footer.email}</a> : null}</div></div><p style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.2)", fontSize: 13, opacity: .65 }}>{landing.footer.legalText}</p></footer>
  </main>;
}
