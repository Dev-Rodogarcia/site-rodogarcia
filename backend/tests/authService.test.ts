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
});
