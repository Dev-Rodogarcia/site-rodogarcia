import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

function makeRequest(body: unknown): Request {
  return { body, ip: "198.51.100.45", header: () => undefined } as unknown as Request;
}

describe("landing B2B leads", () => {
  it("persists only the normalized fields from the campaign form", async () => {
    createIsolatedBackendEnv();
    const { createLead } = await import("../src/services/popupService.js");

    const lead = createLead(makeRequest({
      source: "landing-b2b-form",
      pagePath: "/solucao-logistica",
      name: "  Empresa de teste  ",
      email: "CONTATO@EXAMPLE.COM ",
      phone: "(11) 99999-9999",
      cnpj: "12.345.678/0001-99",
      companyLocation: "  São Paulo - SP ",
      warehouseLocation: "  Jundiaí - SP ",
      notes: "Demanda mensal de armazenagem.",
      privacyAccepted: true,
      utmSource: "linkedin",
      ignored: "não deve ser salvo",
    }));

    expect(lead).toMatchObject({
      source: "landing-b2b-form",
      pagePath: "/solucao-logistica",
      name: "Empresa de teste",
      email: "contato@example.com",
      metadata: {
        cnpj: "12345678000199",
        companyLocation: "São Paulo - SP",
        warehouseLocation: "Jundiaí - SP",
        utmSource: "linkedin",
      },
    });
    expect(lead.metadata).not.toHaveProperty("ignored");
  });

  it("requires complete contact, CNPJ and privacy acceptance for a B2B campaign lead", async () => {
    createIsolatedBackendEnv();
    const { createLead } = await import("../src/services/popupService.js");

    expect(() => createLead(makeRequest({
      source: "landing-b2b-form",
      name: "Pessoa",
      email: "pessoa@example.com",
      phone: "11999999999",
      cnpj: "12345678000199",
      privacyAccepted: false,
    }))).toThrow("aceite a Política de Privacidade");
  });
});
