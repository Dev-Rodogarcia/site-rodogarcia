import { describe, expect, it } from "vitest";
import { effectiveCmsPermissions, hasCmsPermission } from "../src/security/cmsAccess.js";
import type { UserRecord } from "../src/types/auth.js";

function user(patch: Partial<UserRecord> = {}): UserRecord {
  return { id: "usr-test", email: "test@example.com", role: "admin", createdAt: "2026-01-01T00:00:00.000Z", passwordHash: "hash", active: true, ...patch };
}

describe("CMS access resolver", () => {
  it("applies a direct baseline and individual deny/grant overrides", () => {
    const resolved = effectiveCmsPermissions(user({ cmsPermissions: ["home", "services"], cmsPermissionOverrides: [{ permission: "services", effect: "deny" }, { permission: "analytics", effect: "grant" }] }));
    expect(resolved).toEqual(["home", "analytics"]);
  });

  it("keeps the owner with full CMS access", () => {
    const owner = user({ isOwner: true, cmsPermissions: [] });
    expect(hasCmsPermission(owner, "users")).toBe(true);
    expect(effectiveCmsPermissions(owner)).toContain("home");
  });
});
