import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const temporaryRoots: string[] = [];

function isolatedBackend() {
  const env = createIsolatedBackendEnv();
  temporaryRoots.push(env.root);
  return env;
}

function createPublicAsset(publicDir: string, relativePath: string) {
  const filePath = path.join(publicDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "test asset");
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("CMS content regressions", () => {
  it("accepts safe in-page fragments and rejects unsafe URL schemes", async () => {
    isolatedBackend();
    const { sanitizeUrl } = await import("../src/utils/sanitize.js");

    expect(sanitizeUrl("#mapa-regional")).toBe("#mapa-regional");
    expect(sanitizeUrl("#faq:item.2")).toBe("#faq:item.2");
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("data:text/html,unsafe")).toBe("");
    expect(sanitizeUrl("//evil.example/path")).toBe("");
    expect(sanitizeUrl("#1-invalid")).toBe("");
    expect(sanitizeUrl("#invalid fragment")).toBe("");
  });

  it("preserves explicitly empty optional collections in footer and quote content", async () => {
    isolatedBackend();
    const {
      sanitizeFooterGlobal,
      sanitizeFooterPrivacy,
      sanitizeFooterTerms,
    } = await import("../src/services/footerLinksContent.js");
    const { sanitizeQuotePage } = await import("../src/services/pageContent.js");

    const footer = sanitizeFooterGlobal({
      columns: [],
      serviceHours: [],
      socialLinks: [],
      bottomLinks: [],
    });

    expect(footer.columns).toEqual([]);
    expect(footer.serviceHours).toEqual([]);
    expect(footer.socialLinks).toEqual([]);
    expect(footer.bottomLinks).toEqual([]);
    expect(sanitizeFooterTerms({ reading: { blocks: [] } }).reading.blocks).toEqual([]);
    expect(sanitizeFooterPrivacy({ dataSection: { blocks: [] } }).dataSection.blocks).toEqual([]);
    expect(sanitizeQuotePage({ otherChannels: [] }).otherChannels).toEqual([]);
  });

  it("persists an explicitly empty quick-action list and rejects invalid active actions", async () => {
    const env = isolatedBackend();
    createPublicAsset(env.publicDir, "caminhoneiro1.png");
    createPublicAsset(env.publicDir, "certificados/certificado-sassmaq.png");

    const { getHomePage, updateHomeSection } = await import("../src/services/cmsService.js");

    const updated = updateHomeSection("quickActions", { quickActions: [] });
    expect(updated.quickActions).toEqual([]);
    expect(getHomePage().quickActions).toEqual([]);

    expect(() =>
      updateHomeSection("quickActions", {
        quickActions: [
          {
            id: "invalid-modal",
            label: "Mapa",
            icon: "MapPin",
            type: "modal",
            href: "javascript:alert(1)",
            enabled: true,
          },
        ],
      })
    ).toThrow(/destino|atalho/i);

    expect(() =>
      updateHomeSection("quickActions", {
        quickActions: [
          {
            id: "invalid-external",
            label: "Contato",
            icon: "Phone",
            type: "external",
            href: "/fale-conosco",
            enabled: true,
          },
        ],
      })
    ).toThrow(/externo/i);
  });

  it("derives SEO slug from the canonical route and keeps multiline meta tags", async () => {
    const env = isolatedBackend();
    createPublicAsset(env.publicDir, "foto5.png");

    const { getPublicSeoPage, updateSeoPage } = await import("../src/services/seoService.js");
    const result = updateSeoPage(undefined, {
      path: "/servicos",
      slug: "rota-injetada",
      title: "Serviços logísticos para empresas",
      description:
        "Soluções logísticas nacionais com segurança, previsibilidade e rastreabilidade para empresas.",
      canonical: "/servicos",
      metaTags: "  logística nacional  \r\n transporte B2B\n\n  carga segura ",
    });
    const page = result.pages.find((item) => item.path === "/servicos");

    expect(page).toMatchObject({
      path: "/servicos",
      slug: "servicos",
      canonical: "/servicos",
      metaTags: "logística nacional\ntransporte B2B\ncarga segura",
    });
    expect(getPublicSeoPage("/servicos")?.slug).toBe("servicos");
  });
});
