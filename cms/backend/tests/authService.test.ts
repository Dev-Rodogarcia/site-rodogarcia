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
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, login } = await import("../src/services/authService.js");

    createInitialUser({
      name: "Admin",
      email: "admin@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
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
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, login } = await import("../src/services/authService.js");

    createInitialUser({
      name: "Admin",
      email: "admin@rodogarcia.com.br",
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
      setupCode: process.env.ADMIN_SETUP_CODE,
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
    const { createSession, getSession } = await import("../src/security/session.js");

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

    const currentSession = createSession(operator.id);
    const concurrentSession = createSession(operator.id);
    const updated = changeOwnPassword(
      operator,
      {
        currentPassword: VALID_PASSWORD,
        password: "NovaSenhaTeste123",
        confirmPassword: "NovaSenhaTeste123",
      },
      currentSession.id
    );
    expect(isPasswordChangeRequired(updated)).toBe(false);
    expect(getSession(currentSession.id)).not.toBeNull();
    expect(getSession(concurrentSession.id)).toBeNull();
  });

  it("reserves privileged identities and access governance for the supreme user", async () => {
    createIsolatedBackendEnv();
    process.env.ADMIN_SETUP_CODE = "codigo-setup-seguro-123";
    const { createInitialUser, createUser, deleteUser, updateUser } = await import(
      "../src/services/authService.js"
    );
    const { createAccessProfile } = await import("../src/security/cmsAccess.js");

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

    expect(() => createUser(
      {
        name: "Criado por administrador",
        email: "criado-por-admin@rodogarcia.com.br",
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        role: "admin",
        cmsPermissions: ["users"],
      },
      delegatedAdmin
    )).toThrow("Somente o usuário supremo");
    expect(() => updateUser(delegatedAdmin.id, { cmsPermissions: ["users"] }, delegatedAdmin)).toThrow(
      "Somente o usuário supremo"
    );
    expect(() => updateUser(removableUser.id, { permissions: ["deleteUsers"] }, delegatedAdmin)).toThrow(
      "Somente o usuário supremo"
    );
    expect(() => createAccessProfile({ name: "Delegado", permissions: ["users"] }, delegatedAdmin)).toThrow(
      "Somente o usuário supremo"
    );
    expect(() => deleteUser(removableUser.id, delegatedAdmin)).toThrow("Somente o usuário supremo");

    const granted = updateUser(
      delegatedAdmin.id,
      { permissions: ["createUsers", "deleteUsers"] },
      owner
    );
    expect(granted.permissions).toEqual(["createUsers", "deleteUsers"]);
    expect(() => deleteUser(removableUser.id, granted)).toThrow("Somente o usuário supremo");
    expect(() => deleteUser(owner.id, owner)).toThrow("supremo não pode ser excluído");
    deleteUser(removableUser.id, owner);
  });
});
