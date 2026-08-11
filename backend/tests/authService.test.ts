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
  }, 15_000);

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
  }, 15_000);

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

  it("requires legacy and new non-owner accounts to change their temporary password", async () => {
    createIsolatedBackendEnv();
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { changeOwnPassword, createInitialUser, createUser, isPasswordChangeRequired } = await import(
      "../src/services/authService.js"
    );

    const owner = createInitialUser({
      name: "Owner",
      email: "owner@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
    });
    const operator = createUser(
      {
        name: "Operador",
        email: "operador@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
      },
      owner
    );

    expect(isPasswordChangeRequired(owner)).toBe(false);
    expect(isPasswordChangeRequired(operator)).toBe(true);
    expect(isPasswordChangeRequired({ ...operator, mustChangePassword: undefined })).toBe(true);

    const updated = changeOwnPassword(operator, {
      currentPassword: VALID_PASSWORD,
      password: "NovaSenhaTeste123",
      confirmPassword: "NovaSenhaTeste123",
    });
    expect(isPasswordChangeRequired(updated)).toBe(false);
  });

  it("allows every administrator to create users while deletion remains delegated", async () => {
    createIsolatedBackendEnv();
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, createUser, deleteUser, updateUser } = await import(
      "../src/services/authService.js"
    );

    const owner = createInitialUser({
      name: "Owner",
      email: "owner@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
    });
    const delegatedAdmin = createUser(
      {
        name: "Admin Delegado",
        email: "delegado@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
      },
      owner
    );

    const createdByAdmin = createUser(
      {
        name: "Criado por administrador",
        email: "criado-por-admin@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
      },
      delegatedAdmin
    );
    expect(createdByAdmin.mustChangePassword).toBe(true);
    expect(() => updateUser(delegatedAdmin.id, { permissions: ["createUsers"] }, delegatedAdmin)).toThrow(
      "Somente o usuário supremo"
    );
    const removableUser = createUser(
      {
        name: "Conta Removível",
        email: "removivel@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
      },
      owner
    );
    expect(() => deleteUser(removableUser.id, delegatedAdmin)).toThrow("não tem permissão");

    const granted = updateUser(
      delegatedAdmin.id,
      { permissions: ["createUsers", "deleteUsers"] },
      owner
    );
    expect(granted.permissions).toEqual(["createUsers", "deleteUsers"]);

    const createdByDelegate = createUser(
      {
        name: "Criado pelo Delegado",
        email: "criado@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
      },
      granted
    );
    expect(createdByDelegate.mustChangePassword).toBe(true);
    expect(() => deleteUser(owner.id, granted)).toThrow("supremo não pode ser excluído");
    deleteUser(createdByDelegate.id, granted);
    deleteUser(removableUser.id, granted);
  });
});
