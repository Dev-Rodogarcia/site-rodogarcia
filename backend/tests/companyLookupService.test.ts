import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("consulta pública de endereço por CNPJ", () => {
  it("expõe somente o endereço normalizado retornado pelo provedor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            cep: "06090-000",
            logradouro: "Avenida dos Autonomistas",
            numero: "1234",
            complemento: "Galpão 2",
            bairro: "Vila Yara",
            municipio: "Osasco",
            uf: "sp",
            razao_social: "Dado não exposto",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const { lookupCompanyAddress } = await import("../src/services/companyLookupService.js");
    await expect(lookupCompanyAddress("60.960.473/0002-43")).resolves.toEqual({
      cnpj: "60960473000243",
      postalCode: "06090000",
      street: "Avenida dos Autonomistas",
      number: "1234",
      complement: "Galpão 2",
      neighborhood: "Vila Yara",
      city: "Osasco",
      stateCode: "SP",
    });
  });
});
