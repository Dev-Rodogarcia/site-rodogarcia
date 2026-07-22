import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

async function runRateLimit(namespace: string, limitName: "eslQuote" | "eslInvoiceValidation") {
  const { RATE_LIMITS, requireRateLimit } = await import("../src/security/rateLimit.js");
  const handler = requireRateLimit(namespace, RATE_LIMITS[limitName]);
  let error: unknown;
  handler(
    { ip: "198.51.100.21" } as Request,
    {} as Response,
    (nextError) => {
      error = nextError;
    }
  );
  return error;
}

afterEach(() => {
  vi.resetModules();
  restoreEnv();
});

describe("rate limits da integração ESL", () => {
  it("isola a cota de cotação da cota de consulta de NF", async () => {
    createIsolatedBackendEnv();

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await expect(runRateLimit("esl-quote", "eslQuote")).resolves.toBeUndefined();
    }
    const quoteError = await runRateLimit("esl-quote", "eslQuote");
    expect(quoteError).toMatchObject({ status: 429 });

    await expect(
      runRateLimit("esl-invoice-validation", "eslInvoiceValidation")
    ).resolves.toBeUndefined();
  });
});
