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
  return `/${relativePath.replace(/\\/g, "/")}`;
}

function captureError(run: () => unknown) {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("Expected operation to fail");
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("CMS media and lead regressions", () => {
  it("updates only allowed media slots and supports explicitly clearing one", async () => {
    const env = isolatedBackend();
    const imageUrl = createPublicAsset(env.publicDir, "certificate.png");
    const videoUrl = createPublicAsset(env.publicDir, "certificate.mp4");
    const { readMediaSlots, updateMediaSlots } = await import(
      "../src/services/mediaService.js"
    );

    const updated = updateMediaSlots(undefined, {
      "home.cert.iso": imageUrl,
    });
    expect(updated).toEqual({ "home.cert.iso": imageUrl });

    expect(
      captureError(() => updateMediaSlots(undefined, { "unknown.slot": imageUrl }))
    ).toMatchObject({ status: 422 });
    expect(
      captureError(() =>
        updateMediaSlots(undefined, { "home.cert.sassmaq": videoUrl })
      )
    ).toMatchObject({ status: 422, message: expect.stringMatching(/tipo|imagem/i) });
    expect(readMediaSlots()).toEqual({ "home.cert.iso": imageUrl });

    const cleared = updateMediaSlots(undefined, {
      "home.cert.iso": "",
    });
    expect(cleared).toEqual({});
    expect(readMediaSlots()).toEqual({});
  });

  it("rejects replacing an image reference with a video reference", async () => {
    const env = isolatedBackend();
    const imageUrl = createPublicAsset(env.publicDir, "source.png");
    const videoUrl = createPublicAsset(env.publicDir, "target.mp4");
    const { replaceAdminImageReferences } = await import(
      "../src/services/mediaService.js"
    );

    expect(
      captureError(() => replaceAdminImageReferences(imageUrl, videoUrl))
    ).toMatchObject({ status: 422, message: expect.stringMatching(/mesmo tipo/i) });
  });

  it("deduplicates mirrored lead stores before calculating source aggregates", async () => {
    isolatedBackend();
    const {
      contactRepository,
      leadRepository,
      popupLeadRepository,
      quoteRepository,
    } = await import("../src/repositories/jsonRepositories.js");
    const { listUnifiedLeads } = await import("../src/services/leadsService.js");
    const createdAt = "2026-07-14T12:00:00.000Z";

    leadRepository.write([
      {
        id: "contact_1",
        source: "contact-form",
        name: "Contato",
        email: "contato@example.com",
        pagePath: "/fale-conosco",
        createdAt,
        metadata: { contactId: "contact_1" },
      },
      {
        id: "quote_1",
        source: "quote-form",
        name: "Cotação",
        email: "cotacao@example.com",
        pagePath: "/cotacao",
        createdAt,
        metadata: { quoteId: "quote_1" },
      },
      {
        id: "lead_popup_1",
        source: "exit-intent-popup",
        name: "Popup",
        phone: "11999999999",
        pagePath: "/",
        createdAt,
      },
    ]);
    contactRepository.write([
      {
        id: "contact_1",
        name: "Contato",
        email: "contato@example.com",
        pagePath: "/fale-conosco",
        createdAt,
      },
    ]);
    quoteRepository.write([
      {
        id: "quote_1",
        name: "Cotação",
        email: "cotacao@example.com",
        pagePath: "/cotacao",
        createdAt,
      },
    ]);
    popupLeadRepository.write([
      {
        id: "lead_popup_1",
        source: "exit-intent-popup",
        name: "Popup",
        phone: "11999999999",
        pagePath: "/",
        createdAt,
      },
    ]);

    const all = listUnifiedLeads({ pageSize: 10 });
    expect(all.total).toBe(3);
    expect(all.leads).toHaveLength(3);
    expect(all.sourceTotals).toEqual({
      "contact-form": 1,
      "quote-form": 1,
      "exit-intent-popup": 1,
    });

    const contactOnly = listUnifiedLeads({ source: "contact", pageSize: 10 });
    expect(contactOnly.total).toBe(1);
    expect(contactOnly.sourceTotals).toEqual({ "contact-form": 1 });
  });
});
