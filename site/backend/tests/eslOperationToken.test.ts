import type { Request, Response } from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function configureTokenSecret() {
  process.env.NODE_ENV = "test";
  process.env.ESL_OPERATION_SECRET = "test-esl-operation-secret-with-more-than-32-characters";
  vi.resetModules();
}

function expectForbidden(operation: () => void) {
  try {
    operation();
  } catch (error) {
    expect(error).toMatchObject({ status: 403 });
    return;
  }
  throw new Error("A operação deveria ter sido bloqueada.");
}

async function startAppForTest() {
  const { createApp } = await import("../src/app.js");
  const server = createServer(createApp());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Não foi possível obter a porta temporária do teste.");
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  restoreEnv();
});

describe("capabilities de operações ESL", () => {
  it("vincula a capability de manutenção à coleta e rejeita uso em outro id", async () => {
    configureTokenSecret();
    const {
      createCollectionMaintenanceToken,
      requireCollectionMaintenanceToken,
    } = await import("../src/security/eslOperationToken.js");
    const token = createCollectionMaintenanceToken("359397");

    expect(token).not.toContain("359397");
    expect(() => requireCollectionMaintenanceToken(token, "359397")).not.toThrow();
    expectForbidden(() => requireCollectionMaintenanceToken(token, "359398"));
    expectForbidden(() => requireCollectionMaintenanceToken(`${token}x`, "359397"));
  });

  it("rejeita capability ausente no middleware antes de alcançar a operação ESL", async () => {
    configureTokenSecret();
    const { requireCollectionMaintenanceCapability } = await import(
      "../src/security/eslOperationToken.js"
    );
    let nextError: unknown;

    requireCollectionMaintenanceCapability(
      {
        params: { id: "359397" },
        header: () => undefined,
      } as unknown as Request,
      {} as Response,
      (error) => {
        nextError = error;
      }
    );

    expect(nextError).toMatchObject({ status: 403 });
  });

  it("protege PATCH e cancelamento no runtime antes de chamar o ESL", async () => {
    createIsolatedBackendEnv();
    process.env.NODE_ENV = "test";
    process.env.FRONTEND_ORIGIN = "http://127.0.0.1:35180";
    process.env.ESL_OPERATION_SECRET = "test-esl-operation-secret-with-more-than-32-characters";
    vi.resetModules();
    const app = await startAppForTest();
    const headers = {
      "content-type": "application/json",
      origin: "http://127.0.0.1:35180",
    };

    try {
      const update = await fetch(`${app.url}/api/collections/359397`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ comments: "Nova janela de coleta" }),
      });
      const cancellation = await fetch(`${app.url}/api/collections/359397/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "CLIENTE_SOLICITOU" }),
      });

      expect(update.status).toBe(403);
      expect(cancellation.status).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("mantém a validação de NF opaca, curta e vinculada aos dados confirmados", async () => {
    configureTokenSecret();
    const {
      createInvoiceValidationToken,
      invoiceValidationFingerprint,
      requireInvoiceValidationToken,
    } = await import("../src/security/eslOperationToken.js");
    const fingerprint = invoiceValidationFingerprint({
      invoiceKey: "35250300000000000000000000000000000000000000",
      invoiceNumber: "",
      invoiceSeries: "",
      senderCnpj: "01351335000117",
      recipientCnpj: "",
    });
    const token = createInvoiceValidationToken("8950942", fingerprint);

    expect(token).not.toContain("8950942");
    expect(requireInvoiceValidationToken(token, fingerprint)).toBe("8950942");
    expectForbidden(() => requireInvoiceValidationToken(token, `${fingerprint.slice(0, -1)}0`));
  });

  it("expira a validação de NF", async () => {
    configureTokenSecret();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T12:00:00.000Z"));
    const {
      createInvoiceValidationToken,
      requireInvoiceValidationToken,
    } = await import("../src/security/eslOperationToken.js");
    const token = createInvoiceValidationToken("8950942", "a".repeat(64));
    vi.advanceTimersByTime(15 * 60 * 1_000 + 1);

    expectForbidden(() => requireInvoiceValidationToken(token, "a".repeat(64)));
  });
});
