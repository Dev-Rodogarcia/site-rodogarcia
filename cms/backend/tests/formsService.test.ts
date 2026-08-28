import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

function makeRequest(body: unknown, ip = "198.51.100.27"): Request {
  return {
    body,
    ip,
    header: () => undefined,
  } as unknown as Request;
}

describe("public legacy form service", () => {
  it.each([null, [], "not-an-object", 42])("rejects a non-object contact payload (%p) safely", async (body) => {
    createIsolatedBackendEnv();
    const { createContact } = await import("../src/services/formsService.js");

    expect(() => createContact(makeRequest(body))).toThrow("Envie um objeto JSON válido.");
  });

  it("rejects a non-object quote payload safely", async () => {
    createIsolatedBackendEnv();
    const { createQuote } = await import("../src/services/formsService.js");

    expect(() => createQuote(makeRequest(null))).toThrow("Envie um objeto JSON válido.");
  });

  it("accepts a valid contact object and persists only its normalized fields", async () => {
    createIsolatedBackendEnv();
    const { createContact } = await import("../src/services/formsService.js");

    const contact = createContact(makeRequest({
      name: "  Pessoa de teste  ",
      email: "TESTE@EXAMPLE.COM ",
      phone: "(11) 99999-9999",
      subject: "Contato",
      message: "Mensagem de validação.",
      role: "admin",
    }));

    expect(contact).toMatchObject({
      name: "Pessoa de teste",
      email: "teste@example.com",
      subject: "Contato",
      message: "Mensagem de validação.",
    });
    expect(contact).not.toHaveProperty("role");
  });
});
