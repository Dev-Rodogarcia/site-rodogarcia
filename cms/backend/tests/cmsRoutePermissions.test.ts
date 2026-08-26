import fs from "node:fs";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const temporaryRoots: string[] = [];
const servers: Server[] = [];
const frontendOrigin = "http://127.0.0.1:5012";

async function startServer() {
  const isolated = createIsolatedBackendEnv();
  temporaryRoots.push(isolated.root);
  process.env.NODE_ENV = "development";
  process.env.FRONTEND_ORIGIN = frontendOrigin;
  process.env.CORS_ORIGINS = "";

  const { createApp } = await import("../src/app.js");
  const { userRepository } = await import("../src/repositories/userRepository.js");
  const { createSession, SESSION_COOKIE } = await import("../src/security/session.js");

  const createdAt = "2026-08-25T12:00:00.000Z";
  const owner = userRepository.create({
    id: "owner",
    email: "owner@rodogarcia.test",
    name: "Owner",
    role: "admin",
    passwordHash: "unused",
    active: true,
    isOwner: true,
    mustChangePassword: false,
    createdAt,
  });
  const popupAdmin = userRepository.create({
    id: "popup-admin",
    email: "popup@rodogarcia.test",
    name: "Popup admin",
    role: "admin",
    passwordHash: "unused",
    active: true,
    mustChangePassword: false,
    cmsPermissions: ["popup"],
    createdAt,
  });
  const leadsAdmin = userRepository.create({
    id: "leads-admin",
    email: "leads@rodogarcia.test",
    name: "Leads admin",
    role: "admin",
    passwordHash: "unused",
    active: true,
    mustChangePassword: false,
    cmsPermissions: ["leads"],
    createdAt,
  });
  const cookieMonitoringAdmin = userRepository.create({
    id: "cookie-monitoring-admin",
    email: "cookie-monitoring@rodogarcia.test",
    name: "Cookie monitoring admin",
    role: "admin",
    passwordHash: "unused",
    active: true,
    isOwner: false,
    mustChangePassword: false,
    cmsPermissions: ["cookie-monitoring"],
    createdAt,
  });
  const cookiesAdmin = userRepository.create({
    id: "cookies-admin",
    email: "cookies@rodogarcia.test",
    name: "Cookies admin",
    role: "admin",
    passwordHash: "unused",
    active: true,
    isOwner: false,
    mustChangePassword: false,
    cmsPermissions: ["cookies"],
    createdAt,
  });
  const usersAdmin = userRepository.create({
    id: "users-admin",
    email: "users@rodogarcia.test",
    name: "Users admin",
    role: "admin",
    passwordHash: "unused",
    active: true,
    mustChangePassword: false,
    cmsPermissions: ["users"],
    createdAt,
  });

  const ownerSession = createSession(owner.id);
  const popupSession = createSession(popupAdmin.id);
  const leadsSession = createSession(leadsAdmin.id);
  const cookieMonitoringSession = createSession(cookieMonitoringAdmin.id);
  const cookiesSession = createSession(cookiesAdmin.id);
  const usersSession = createSession(usersAdmin.id);
  const server = createApp().listen(0, "127.0.0.1");
  servers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Servidor de teste sem porta TCP.");

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    ownerHeaders: {
      Cookie: `${SESSION_COOKIE}=${ownerSession.id}`,
      Origin: frontendOrigin,
      "X-CSRF-Token": ownerSession.csrfToken,
      "Content-Type": "application/json",
    },
    popupHeaders: {
      Cookie: `${SESSION_COOKIE}=${popupSession.id}`,
      Origin: frontendOrigin,
      "X-CSRF-Token": popupSession.csrfToken,
      "Content-Type": "application/json",
    },
    leadsHeaders: {
      Cookie: `${SESSION_COOKIE}=${leadsSession.id}`,
      Origin: frontendOrigin,
      "X-CSRF-Token": leadsSession.csrfToken,
      "Content-Type": "application/json",
    },
    cookieMonitoringHeaders: {
      Cookie: `${SESSION_COOKIE}=${cookieMonitoringSession.id}`,
    },
    cookiesHeaders: {
      Cookie: `${SESSION_COOKIE}=${cookiesSession.id}`,
    },
    usersHeaders: {
      Cookie: `${SESSION_COOKIE}=${usersSession.id}`,
      Origin: frontendOrigin,
      "X-CSRF-Token": usersSession.csrfToken,
      "Content-Type": "application/json",
    },
  };
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.closeAllConnections();
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("CMS route permissions", () => {
  it("separates popup configuration from lead data without closing public popup configuration", async () => {
    const { baseUrl, popupHeaders, leadsHeaders } = await startServer();

    expect((await fetch(`${baseUrl}/api/popup-config`)).status).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/popup-events?days=30`, {
          headers: { Cookie: popupHeaders.Cookie },
        })
      ).status
    ).toBe(200);
    expect(
      (
        await fetch(`${baseUrl}/api/popup-config`, {
          method: "POST",
          headers: popupHeaders,
          body: JSON.stringify({ enabled: false }),
        })
      ).status
    ).toBe(200);

    for (const pathname of ["/api/leads", "/api/contact", "/api/quote"]) {
      expect(
        (await fetch(`${baseUrl}${pathname}`, { headers: { Cookie: popupHeaders.Cookie } })).status
      ).toBe(403);
    }

    for (const pathname of ["/api/leads", "/api/contact", "/api/quote"]) {
      expect(
        (await fetch(`${baseUrl}${pathname}`, { headers: { Cookie: leadsHeaders.Cookie } })).status
      ).toBe(200);
    }
    expect(
      (
        await fetch(`${baseUrl}/api/popup-events?days=30`, {
          headers: { Cookie: leadsHeaders.Cookie },
        })
      ).status
    ).toBe(403);
    expect(
      (
        await fetch(`${baseUrl}/api/popup-config`, {
          method: "POST",
          headers: leadsHeaders,
          body: JSON.stringify({ enabled: false }),
        })
      ).status
    ).toBe(403);
  }, 15_000);

  it("separates cookie consent monitoring from consent settings", async () => {
    const { baseUrl, cookieMonitoringHeaders, cookiesHeaders } = await startServer();

    expect(
      (await fetch(`${baseUrl}/api/admin/cookie-consents`, { headers: cookieMonitoringHeaders })).status
    ).toBe(200);
    expect(
      (await fetch(`${baseUrl}/api/admin/consent-settings`, { headers: cookieMonitoringHeaders })).status
    ).toBe(403);
    expect(
      (await fetch(`${baseUrl}/api/admin/consent-settings`, { headers: cookiesHeaders })).status
    ).toBe(200);
    expect(
      (await fetch(`${baseUrl}/api/admin/cookie-consents`, { headers: cookiesHeaders })).status
    ).toBe(403);
  });

  it("reserves access governance and user mutations for the supreme user", async () => {
    const { baseUrl, ownerHeaders, usersHeaders } = await startServer();

    const delegatedProfiles = await fetch(`${baseUrl}/api/admin/access-profiles`, {
      headers: { Cookie: usersHeaders.Cookie },
    });
    expect(delegatedProfiles.status).toBe(403);
    expect(delegatedProfiles.headers.get("cache-control")).toBe("private, no-store");

    const ownerProfiles = await fetch(`${baseUrl}/api/admin/access-profiles`, {
      headers: { Cookie: ownerHeaders.Cookie },
    });
    expect(ownerProfiles.status).toBe(200);
    expect(ownerProfiles.headers.get("cache-control")).toBe("private, no-store");

    expect(
      (
        await fetch(`${baseUrl}/api/admin/access-profiles`, {
          method: "POST",
          headers: usersHeaders,
          body: JSON.stringify({ name: "Tentativa delegada", permissions: ["users"] }),
        })
      ).status
    ).toBe(403);
    expect(
      (
        await fetch(`${baseUrl}/api/admin/users`, {
          method: "POST",
          headers: usersHeaders,
          body: JSON.stringify({
            name: "Novo administrador",
            email: "novo-admin@rodogarcia.test",
            password: "SenhaTeste123",
            confirmPassword: "SenhaTeste123",
            role: "admin",
            cmsPermissions: ["users"],
          }),
        })
      ).status
    ).toBe(403);
    expect(
      (
        await fetch(`${baseUrl}/api/admin/users/users-admin`, {
          method: "PUT",
          headers: usersHeaders,
          body: JSON.stringify({ cmsPermissions: ["users", "home"] }),
        })
      ).status
    ).toBe(403);
  });

  it("returns a safe malformed JSON response and throttles improvements before parsing files", async () => {
    const { baseUrl, leadsHeaders } = await startServer();

    const malformed = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        Origin: frontendOrigin,
        "Content-Type": "application/json",
      },
      body: '{"email":',
    });
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({ error: "JSON inválido." });

    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.headers.get("cache-control")).toBe("private, no-store");

    const protectedLeads = await fetch(`${baseUrl}/api/leads`, {
      headers: { Cookie: leadsHeaders.Cookie },
    });
    expect(protectedLeads.status).toBe(200);
    expect(protectedLeads.headers.get("cache-control")).toBe("private, no-store");

    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(
        (
          await fetch(`${baseUrl}/api/improvements`, {
            method: "POST",
            headers: { Origin: frontendOrigin },
          })
        ).status
      ).toBe(422);
    }
    expect(
      (
        await fetch(`${baseUrl}/api/improvements`, {
          method: "POST",
          headers: { Origin: frontendOrigin },
        })
      ).status
    ).toBe(429);
  });
});
