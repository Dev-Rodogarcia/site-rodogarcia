import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

describe("consentService", () => {
  it("stores LGPD consent with masked IP and without location unless allowed", async () => {
    createIsolatedBackendEnv();
    const { recordCookieConsent, listCookieConsents } = await import("../src/services/consentService.js");

    const consent = recordCookieConsent({
      body: {
        decision: "partial",
        version: 3,
        categories: { necessary: true, analytics: true, marketing: false },
        sessionId: "sess-test",
        scriptsLoaded: ["ga4"],
        scriptsFailed: ["clarity"],
        approximateLocation: "Bauru/SP",
        locationAllowed: false,
      },
      ip: "203.0.113.45",
      header(name: string) {
        if (name.toLowerCase() === "user-agent") return "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
        return "";
      },
    } as never);

    expect(consent.status).toBe("partial");
    expect(consent.ipMasked).toBe("203.0.0.0");
    expect(consent.device).toBe("mobile");
    expect(consent.approximateLocation).toBe("");
    expect(consent.scriptsLoaded).toEqual(["ga4"]);
    expect(consent.scriptsFailed).toEqual(["clarity"]);

    const listed = listCookieConsents({ status: "partial", device: "mobile", pageSize: 10 });
    expect(listed.total).toBe(1);
    expect(listed.consents[0]?.id).toBe(consent.id);
  });
});
