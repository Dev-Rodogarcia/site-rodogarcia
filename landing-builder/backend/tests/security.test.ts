import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import type { AddressInfo } from "node:net";
import { createRateLimiter } from "../src/security/rateLimit.ts";

const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-landing-security-"));
const serviceToken = "test-service-token-with-at-least-thirty-two-characters";

process.env.NODE_ENV = "test";
process.env.LANDING_BUILDER_STORAGE_ROOT = storageRoot;
process.env.LANDING_BUILDER_SERVICE_TOKEN = serviceToken;

const { createApp } = await import("../src/app.ts");

function createInput(slug: string) {
  return {
    name: "Landing de teste",
    slug,
    theme: {},
    analytics: {
      ga4MeasurementId: "G-TEST1234",
      gtmContainerId: "GTM-TEST123",
      metaPixelId: "123456789",
      googleAdsId: "AW-TEST123",
    },
    hero: {
      title: "Título seguro",
      highlights: [{ title: "Destaque", description: "Descrição" }],
    },
    lowerSection: { title: "Seção inferior" },
  };
}

async function withServer<T>(callback: (baseUrl: string) => Promise<T>) {
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;

  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

after(() => fs.rmSync(storageRoot, { recursive: true, force: true }));

test("rate limiter bloqueia a mesma origem até a janela expirar", () => {
  let now = 0;
  const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1_000 }, () => now);

  assert.equal(limiter.consume("127.0.0.1").allowed, true);
  assert.equal(limiter.consume("127.0.0.1").allowed, true);
  const blocked = limiter.consume("127.0.0.1");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);

  now = 1_000;
  assert.equal(limiter.consume("127.0.0.1").allowed, true);
});

test("mutações internas exigem JSON e erros de parse não expõem detalhes", async () => {
  await withServer(async (baseUrl) => {
    const headers = { "x-landing-builder-service-token": serviceToken };
    const unsupported = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers: { ...headers, "content-type": "text/plain" },
      body: "{}",
    });
    assert.equal(unsupported.status, 415);

    const malformed = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "JSON inválido." });
  });
});

test("rota pública devolve somente o DTO publicado necessário", async () => {
  await withServer(async (baseUrl) => {
    const slug = `seguranca-${Date.now()}`;
    const headers = {
      "content-type": "application/json",
      "x-landing-builder-service-token": serviceToken,
    };
    const created = await fetch(`${baseUrl}/api/internal/landings`, {
      method: "POST",
      headers,
      body: JSON.stringify(createInput(slug)),
    });
    assert.equal(created.status, 201);
    const createdPayload = await created.json() as { landing: { id: string } };

    const published = await fetch(`${baseUrl}/api/internal/landings/${createdPayload.landing.id}/publish`, {
      method: "POST",
      headers,
      body: "{}",
    });
    assert.equal(published.status, 200);

    const response = await fetch(`${baseUrl}/api/public/landings/${slug}`);
    assert.equal(response.status, 200);
    const payload = await response.json() as { landing: Record<string, unknown> & { template?: string; benefits?: { items?: unknown[] }; faq?: { items?: unknown[] }; footer?: { brand?: string } } };
    assert.equal(payload.landing.slug, slug);
    assert.equal(payload.landing.template, "campaign-v1");
    assert.equal(payload.landing.benefits?.items?.length, 3);
    assert.equal(payload.landing.faq?.items?.length, 3);
    assert.equal(payload.landing.footer?.brand, "Sua empresa");
    assert.deepEqual(payload.landing.analytics, { ga4MeasurementId: "G-TEST1234" });
    assert.equal("id" in payload.landing, false);
    assert.equal("status" in payload.landing, false);
    assert.equal("createdAt" in payload.landing, false);
    assert.equal("updatedAt" in payload.landing, false);
  });
});
