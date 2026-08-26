import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  vi.resetModules();
}

function setEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

function setProductionEnv(values: NodeJS.ProcessEnv) {
  resetEnv();
  process.env.NODE_ENV = "production";
  setEnvValue("FRONTEND_ORIGIN", values.FRONTEND_ORIGIN);
  setEnvValue("CORS_ORIGINS", values.CORS_ORIGINS);
  setEnvValue("ADMIN_SETUP_CODE", values.ADMIN_SETUP_CODE);
  setEnvValue("SESSION_SECRET", values.SESSION_SECRET);
  setEnvValue("JWT_SECRET", values.JWT_SECRET);
}

describe("env production hardening", () => {
  afterEach(() => {
    resetEnv();
  });

  it("rejects weak production configuration", async () => {
    setProductionEnv({
      FRONTEND_ORIGIN: "http://127.0.0.1:5010",
      ADMIN_SETUP_CODE: "altere-para-um-codigo-forte",
      SESSION_SECRET: "short",
    });

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "Configuração de produção insegura"
    );
  });

  it("accepts strong production configuration with HTTPS origins", async () => {
    setProductionEnv({
      FRONTEND_ORIGIN: "https://www.rodogarcia.com.br",
      CORS_ORIGINS: "https://rodogarcia.com.br",
      ADMIN_SETUP_CODE: "setup-code-2026-safe-value",
      SESSION_SECRET: "session-secret-with-more-than-32-characters",
    });

    const { env } = await import("../src/config/env.js");

    expect(env.isProduction).toBe(true);
    expect(env.allowedOrigins.has("https://www.rodogarcia.com.br")).toBe(true);
    expect(env.allowedOrigins.has("https://rodogarcia.com.br")).toBe(true);
    expect(env.allowedOrigins.has("http://127.0.0.1:4010")).toBe(false);
  });
});
