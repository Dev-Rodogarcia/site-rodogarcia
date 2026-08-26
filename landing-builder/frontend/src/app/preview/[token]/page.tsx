import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/LandingPageView";
import { fetchPreviewLanding } from "@/lib/landing";

type PreviewPageProps = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const landing = await fetchPreviewLanding((await params).token);
  if (!landing) return { robots: { index: false, follow: false } };
  return {
    title: `${landing.seo.title} | Prévia`,
    description: landing.seo.description,
    robots: { index: false, follow: false },
  };
}

export default async function LandingPreviewRoute({ params }: PreviewPageProps) {
  const landing = await fetchPreviewLanding((await params).token);
  if (!landing) notFound();
  return <LandingPageView landing={landing} preview />;
}
