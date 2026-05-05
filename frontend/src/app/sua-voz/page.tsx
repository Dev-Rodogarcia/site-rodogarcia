import type { Metadata } from "next";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { seo, site } from "@/lib/routes";

const FORM_URL = "https://forms.office.com/r/XwCZGct8QK";
const BANNER_URL =
  "https://vps.multiverso.pro/lunar/rodogarcia/uploads/Banner_site_sua_voz_c8dd1565e7.svg";

const fallbackMetadata: Metadata = {
  title: "Sua Voz",
  description:
    "Canal oficial da Rodogarcia para manifestações, denúncias e comunicações internas com sigilo e segurança.",
  alternates: { canonical: seo.absoluteUrl(site.voice) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.voice, fallbackMetadata);
}

export default function SuaVozPage() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-slate-950 px-5 py-24 sm:px-8 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative mx-auto w-full max-w-[980px]">
        <div
          className="relative overflow-hidden rounded-[30px] border border-white/12 bg-slate-900 bg-cover bg-center px-6 py-14 text-center shadow-[0_28px_90px_rgba(2,6,23,0.42)] sm:px-10 sm:py-16 lg:px-14 lg:py-20"
          style={{ backgroundImage: `linear-gradient(180deg,rgba(2,6,23,0.58),rgba(2,6,23,0.72)),url(${BANNER_URL})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_42%,rgba(2,6,23,0.18)_100%)]" />
          <div className="relative mx-auto max-w-[720px]">
            <span className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/82 backdrop-blur-sm">
              Canal oficial
            </span>
            <h1 className="mt-6 text-[clamp(2.35rem,6vw,4.8rem)] font-bold leading-[0.96] tracking-[-0.05em] text-white">
              Sua Voz é Respeitada Aqui!
            </h1>
            <p className="mx-auto mt-5 max-w-[42rem] text-sm leading-7 text-white/74 sm:text-base">
              Este é o canal oficial para envio de manifestações, denúncias e comunicações internas com total sigilo e segurança.
            </p>
            <div className="mt-9 flex justify-center">
              <a
                href={FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 max-w-full min-w-0 items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[var(--foreground)] shadow-[0_18px_44px_rgba(2,6,23,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_22px_54px_rgba(2,6,23,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                <span className="min-w-0 truncate">Canal oficial de denúncias</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
