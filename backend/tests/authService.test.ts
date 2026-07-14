import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const VALID_PASSWORD = "SenhaTeste123";

function requestBody(email: string, password: string, ip = "203.0.113.10") {
  return {
    body: { email, password },
    ip,
    header(name: string) {
      if (name.toLowerCase() === "x-forwarded-for") return ip;
      return "";
    },
  } as never;
}

describe("authService", () => {
  it("blocks login after repeated failures from the same IP", async () => {
    createIsolatedBackendEnv();
    const { createUser, login } = await import("../src/services/authService.js");

    createUser({
      name: "Admin",
      email: "admin@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      role: "admin",
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(() =>
        login(requestBody("admin@rodogarcia.com.br", "SenhaErrada123"))
      ).toThrow("Credenciais invalidas.");
    }

    expect(() =>
      login(requestBody("admin@rodogarcia.com.br", VALID_PASSWORD))
    ).toThrow("Muitas tentativas de login.");
  });

  it("blocks login after repeated failures against the same email", async () => {
    createIsolatedBackendEnv();
    const { createUser, login } = await import("../src/services/authService.js");

    createUser({
      name: "Admin",
      email: "admin@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      role: "admin",
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(() =>
        login(
          requestBody(
            "admin@rodogarcia.com.br",
            "SenhaErrada123",
            `203.0.113.${attempt + 20}`
          )
        )
      ).toThrow("Credenciais invalidas.");
    }

    expect(() =>
      login(requestBody("admin@rodogarcia.com.br", VALID_PASSWORD, "203.0.113.250"))
    ).toThrow("Muitas tentativas de login.");
  });

  it("preserves omitted fields and rejects role or active coercion on update", async () => {
    createIsolatedBackendEnv();
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, createUser, updateUser } = await import(
      "../src/services/authService.js"
    );

    const owner = createInitialUser({
      name: "Owner",
      email: "owner@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
    });
    const target = createUser(
      {
        name: "Operador",
        email: "operador@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "user",
      },
      owner
    );

    const renamed = updateUser(target.id, { name: "Operador Atualizado" }, owner);
    expect(renamed.role).toBe("user");
    expect(renamed.active).toBe(true);

    expect(() => updateUser(target.id, { role: "owner" }, owner)).toThrow(
      "Perfil de acesso inválido."
    );
    expect(() => updateUser(target.id, { active: "false" }, owner)).toThrow(
      "status do usuário deve ser booleano"
    );

    expect(updateUser(target.id, { active: false }, owner).active).toBe(false);

    expect(() =>
      createUser(
        {
          name: "E-mail repetido",
          email: target.email,
          password: VALID_PASSWORD,
          confirmPassword: VALID_PASSWORD,
          role: "user",
        },
        owner
      )
    ).toThrow("Ja existe conta com este e-mail.");
  });

  it("does not accept owner escalation or an implicit admin role on creation", async () => {
    createIsolatedBackendEnv();
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, createUser, isSupremeUser } = await import(
      "../src/services/authService.js"
    );

    const owner = createInitialUser({
      name: "Owner",
      email: "owner@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
    });

    expect(() =>
      createUser(
        {
          name: "Sem perfil",
          email: "sem-perfil@rodogarcia.com.br",
          password: VALID_PASSWORD,
          confirmPassword: VALID_PASSWORD,
        },
        owner
      )
    ).toThrow("Perfil de acesso inválido.");

    const attemptedOwner = createUser(
      {
        name: "Admin comum",
        email: "admin-comum@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
        isOwner: true,
      } as never,
      owner
    );

    expect(attemptedOwner.isOwner).toBe(false);
    expect(isSupremeUser(attemptedOwner)).toBe(false);
  });
});
