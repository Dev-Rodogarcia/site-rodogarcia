import { describe, expect, it } from "vitest";
import { parseImprovement } from "../src/validators/improvement.js";

const base = {
  name: "Ana Silva",
  email: "ana@example.com",
  message: "O formulário poderia deixar mais claro o próximo passo para o visitante.",
};

describe("validação de sugestões de melhoria", () => {
  it("aceita uma sugestão de usuário ligada ao site", () => {
    expect(parseImprovement({ ...base, profile: "site_user", category: "site_suggestion", page: "/cotacao" })).toMatchObject({ profile: "site_user", category: "site_suggestion", page: "/cotacao" });
  });

  it("rejeita categoria operacional para usuário do site", () => {
    expect(() => parseImprovement({ ...base, profile: "site_user", category: "automation" })).toThrow("categoria relacionada ao site");
  });

  it("exige filial para colaborador e não aceita CPF no contrato", () => {
    expect(() => parseImprovement({ ...base, profile: "employee", category: "automation" })).toThrow("filial");
    expect(parseImprovement({ ...base, profile: "employee", category: "automation", branch: "Osasco/SP", cpf: "12345678901" })).not.toHaveProperty("cpf");
  });

  it("normaliza telefone brasileiro e bloqueia quantidade inválida de dígitos", () => {
    expect(parseImprovement({ ...base, profile: "employee", category: "automation", branch: "Osasco/SP", phone: "(11) 99999-0000" }).phone).toBe("11999990000");
    expect(() => parseImprovement({ ...base, profile: "employee", category: "automation", branch: "Osasco/SP", phone: "11999" })).toThrow("telefone brasileiro válido");
  });
});
