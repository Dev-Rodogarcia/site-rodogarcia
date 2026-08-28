import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import type { AddressInfo } from "node:net";
import sharp from "sharp";

const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-landing-media-"));
const serviceToken = "test-service-token-with-at-least-thirty-two-characters";

process.env.NODE_ENV = "test";
process.env.LANDING_BUILDER_STORAGE_ROOT = storageRoot;
process.env.LANDING_BUILDER_SERVICE_TOKEN = serviceToken;

const { createApp } = await import("../src/app.ts");

function createInput(slug: string, mediaUrl = "", index = true) {
  return {
    name: "Landing de mídia",
    slug,
    seo: { title: "SEO da campanha", description: "Descrição curta para resultados de busca.", index },
    theme: {},
    analytics: { ga4MeasurementId: "G-TEST1234" },
    hero: {
      title: "Título seguro",
      highlights: [{ title: "Destaque", description: "Descrição" }],
    },
    lowerSection: { title: "Seção inferior" },
    story: { image: mediaUrl },
  };
}

async function withServer<T>(callback: (baseUrl: string) => Promise<T>) {
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function internalHeaders() {
  return { "x-landing-builder-service-token": serviceToken };
}

after(async () => {
  // O Windows pode manter o handle do arquivo recém-servido por alguns instantes.
  await new Promise<void>((resolve) => setTimeout(resolve, 250));
  try {
    fs.rmSync(storageRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    // O diretório fica exclusivamente no TEMP do processo de teste e é removível
    // depois que o processo libera o handle de arquivo no Windows.
  }
});

test("mídia própria exige assinatura real, otimiza imagem e bloqueia exclusão em uso", async () => {
  await withServer(async (baseUrl) => {
    const invalidForm = new FormData();
    invalidForm.set("file", new Blob([Buffer.from("não é uma imagem")], { type: "image/png" }), "fraude.png");
    const invalid = await fetch(`${baseUrl}/api/internal/media`, {
      method: "POST",
      headers: internalHeaders(),
      body: invalidForm,
    });
    assert.equal(invalid.status, 422);

    const png = await sharp({
      create: { width: 24, height: 16, channels: 4, background: { r: 20, g: 50, b: 80, alpha: 1 } },
    }).png().toBuffer();
    const form = new FormData();
    form.set("file", new Blob([png], { type: "image/png" }), "campanha.png");
    const uploaded = await fetch(`${baseUrl}/api/internal/media`, {
      method: "POST",
      headers: internalHeaders(),
      body: form,
    });
    assert.equal(uploaded.status, 201);
    const uploadedPayload = await uploaded.json() as { media: { id: string; url: string; mimeType: string } };
    assert.match(uploadedPayload.media.url, /^\/landing-media\/media_[A-Za-z0-9-]{36}$/);
    assert.equal(uploadedPayload.media.mimeType, "image/webp");

    const served = await fetch(`${baseUrl}${uploadedPayload.media.url}`);
    assert.equal(served.status, 200);
    assert.match(served.headers.get("content-type") ?? "", /^image\/webp/);
    assert.equal(served.headers.get("cache-control"), "public, max-age=31536000, immutable");
    const servedImage = Buffer.from(await served.arrayBuffer());
    assert.equal(servedImage.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(servedImage.subarray(8, 12).toString("ascii"), "WEBP");

    const mp4 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from("ftypisom", "ascii"),
      Buffer.alloc(4),
      Buffer.from("isomiso2", "ascii"),
    ]);
    const videoForm = new FormData();
    videoForm.set("file", new Blob([mp4], { type: "video/mp4" }), "campanha.mp4");
    const uploadedVideo = await fetch(`${baseUrl}/api/internal/media`, {
      method: "POST",
      headers: internalHeaders(),
      body: videoForm,
    });
    assert.equal(uploadedVideo.status, 201);
    const uploadedVideoPayload = await uploadedVideo.json() as { media: { url: string; kind: string; mimeType: string } };
    assert.equal(uploadedVideoPayload.media.kind, "video");
    assert.equal(uploadedVideoPayload.media.mimeType, "video/mp4");
    const servedVideo = await fetch(`${baseUrl}${uploadedVideoPayload.media.url}`);
    assert.equal(servedVideo.status, 200);
    assert.deepEqual(Buffer.from(await servedVideo.arrayBuffer()), mp4);

    const landing = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers: { ...internalHeaders(), "content-type": "application/json" },
      body: JSON.stringify(createInput(`midia-${Date.now()}`, uploadedPayload.media.url)),
    });
    assert.equal(landing.status, 201);

    const deletionInUse = await fetch(`${baseUrl}/api/internal/media/${uploadedPayload.media.id}`, {
      method: "DELETE",
      headers: internalHeaders(),
    });
    assert.equal(deletionInUse.status, 409);

    const legacyReference = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers: { ...internalHeaders(), "content-type": "application/json" },
      body: JSON.stringify(createInput(`legado-${Date.now()}`, "/uploads/nao-permitido.webp")),
    });
    assert.equal(legacyReference.status, 422);
  });
});

test("prévia de rascunho é opaca, indexa somente publicadas e devolve SEO mínimo", async () => {
  await withServer(async (baseUrl) => {
    const slug = `previa-${Date.now()}`;
    const created = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers: { ...internalHeaders(), "content-type": "application/json" },
      body: JSON.stringify(createInput(slug)),
    });
    assert.equal(created.status, 201);
    const createdPayload = await created.json() as { landing: { id: string; previewToken?: string } };
    assert.equal("previewToken" in createdPayload.landing, false);

    const publicDraft = await fetch(`${baseUrl}/api/public/landings/${slug}`);
    assert.equal(publicDraft.status, 404);

    const preview = await fetch(`${baseUrl}/api/internal/landings/${createdPayload.landing.id}/preview`, {
      method: "POST",
      headers: internalHeaders(),
    });
    assert.equal(preview.status, 200);
    const previewPayload = await preview.json() as { previewPath: string };
    assert.match(previewPayload.previewPath, /^\/preview\/[A-Za-z0-9_-]{43}$/);
    const previewToken = previewPayload.previewPath.split("/").at(-1)!;

    const previewResponse = await fetch(`${baseUrl}/api/public/previews/${previewToken}`);
    assert.equal(previewResponse.status, 200);
    assert.equal(previewResponse.headers.get("cache-control"), "private, no-store");
    assert.equal(previewResponse.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    const previewBody = await previewResponse.json() as { landing: { seo: { title: string; index: boolean }; id?: string } };
    assert.deepEqual(previewBody.landing.seo, { title: "SEO da campanha", description: "Descrição curta para resultados de busca.", index: true });
    assert.equal("id" in previewBody.landing, false);

    const beforePublishing = await fetch(`${baseUrl}/api/public/landings`);
    assert.deepEqual(await beforePublishing.json(), { landings: [] });

    const published = await fetch(`${baseUrl}/api/internal/landings/${createdPayload.landing.id}/publish`, {
      method: "POST",
      headers: internalHeaders(),
    });
    assert.equal(published.status, 200);

    const index = await fetch(`${baseUrl}/api/public/landings`);
    const indexPayload = await index.json() as { landings: Array<{ slug: string; updatedAt: string; status?: string }> };
    assert.deepEqual(indexPayload.landings.map((item) => item.slug), [slug]);
    assert.equal("status" in indexPayload.landings[0]!, false);
    assert.match(indexPayload.landings[0]!.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

    const removeFromIndex = await fetch(`${baseUrl}/api/internal/landings/${createdPayload.landing.id}`, {
      method: "PUT",
      headers: { ...internalHeaders(), "content-type": "application/json" },
      body: JSON.stringify(createInput(slug, "", false)),
    });
    assert.equal(removeFromIndex.status, 200);
    const hiddenIndex = await fetch(`${baseUrl}/api/public/landings`);
    assert.deepEqual(await hiddenIndex.json(), { landings: [] });
  });
});
