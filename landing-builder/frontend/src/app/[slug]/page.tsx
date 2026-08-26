import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/LandingPageView";
import { fetchLanding, landingUrl } from "@/lib/landing";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const landing = await fetchLanding((await params).slug);
  if (!landing) return {};
  const canonical = landingUrl(landing.slug);
  return {
    title: landing.seo.title,
    description: landing.seo.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: landing.seo.title,
      description: landing.seo.description,
    },
    robots: { index: landing.seo.index, follow: true },
  };
}

export default async function LandingPageRoute({ params }: PageProps) {
  const landing = await fetchLanding((await params).slug);
  if (!landing) notFound();
  return <LandingPageView landing={landing} />;
}
