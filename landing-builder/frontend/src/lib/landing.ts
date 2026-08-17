export interface LandingPage {
  name: string;
  slug: string;
  theme: { primaryColor: string; secondaryColor: string; backgroundColor: string; textColor: string; font: string };
  analytics: { ga4MeasurementId: string };
  hero: { phone: string; email: string; logo: string; backgroundImage: string; eyebrow: string; title: string; description: string; ctaLabel: string; ctaUrl: string; highlights: Array<{ title: string; description: string }> };
  lowerSection: { title: string; description: string; ctaLabel: string; ctaUrl: string };
}

export async function fetchLanding(slug: string): Promise<LandingPage | null> {
  try {
    const backendUrl = (process.env.LANDING_BUILDER_BACKEND_URL ?? "http://127.0.0.1:6110").replace(/\/+$/, "");
    const response = await fetch(`${backendUrl}/api/public/landings/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as { landing?: LandingPage };
    return payload.landing ?? null;
  } catch { return null; }
}
