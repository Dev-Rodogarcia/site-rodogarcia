import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

function publicTrackingRequest(body: Record<string, unknown>) {
  return {
    body,
    ip: "203.0.113.15",
    header(name: string) {
      return name.toLowerCase() === "user-agent" ? "Mozilla/5.0" : "";
    },
  } as never;
}

describe("trackingService", () => {
  it("does not persist or return user IDs supplied by public tracking requests", async () => {
    createIsolatedBackendEnv();
    const { createPublicTrackingEvent, listTrackingEvents } = await import(
      "../src/services/trackingService.js"
    );
    const { createAnalyticsEvent, getAnalyticsStats } = await import(
      "../src/services/analyticsService.js"
    );

    createPublicTrackingEvent(
      publicTrackingRequest({
        event: "page_view",
        page: "/",
        sessionId: "anonymous-session",
        userId: "forged-user-id",
      })
    );
    createAnalyticsEvent(
      publicTrackingRequest({
        event: "click",
        page: "/",
        sessionId: "anonymous-session",
        userId: "forged-analytics-user-id",
      })
    );

    const events = listTrackingEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ sessionId: "anonymous-session" });
    expect(events).not.toContainEqual(expect.objectContaining({ userId: expect.anything() }));

    const analytics = getAnalyticsStats(30);
    expect(analytics.recentEvents).not.toContainEqual(
      expect.objectContaining({ userId: expect.anything() })
    );
  });

  it("calculates the filtered summary over the full tracking history", async () => {
    createIsolatedBackendEnv();
    const { trackingEventRepository } = await import(
      "../src/repositories/jsonRepositories.js"
    );
    const { getTrackingSummary, listTrackingEvents } = await import(
      "../src/services/trackingService.js"
    );
    const timestamp = Date.now();

    trackingEventRepository.write(
      Array.from({ length: 1005 }, (_, index) => ({
        id: `tracking-${index}`,
        event: "page_view",
        type: "page_view",
        page: "/servicos",
        timestamp: timestamp + index,
        createdAt: new Date(timestamp + index).toISOString(),
      }))
    );

    expect(listTrackingEvents({ limit: 10 })).toHaveLength(10);
    expect(getTrackingSummary({ limit: 10 })).toMatchObject({
      total: 1005,
      byType: { page_view: 1005 },
      topPages: [{ page: "/servicos", total: 1005 }],
    });
  });

  it("counts only completed forms as form conversions", async () => {
    createIsolatedBackendEnv();
    const { trackingEventRepository } = await import(
      "../src/repositories/jsonRepositories.js"
    );
    const { getAnalyticsStats } = await import("../src/services/analyticsService.js");
    const timestamp = Date.now();
    const names = [
      ["form_submit", "contact"],
      ["form_success", "contact"],
      ["form_success", "exit-intent-popup"],
      ["popup_submitted", "exit-intent-popup"],
      ["lead_created", "contact"],
      ["lead_created", "exit-intent-popup"],
    ] as const;

    trackingEventRepository.write(
      names.map(([event, element], index) => ({
        id: `tracking-${index}`,
        event,
        type: event,
        element,
        page: "/",
        sessionId: `session-${index}`,
        timestamp: timestamp + index,
        createdAt: new Date(timestamp + index).toISOString(),
      }))
    );

    expect(getAnalyticsStats(30).stats.conversions).toMatchObject({
      forms: 1,
      popupSubmissions: 1,
      leads: 2,
      total: 2,
    });
  });

  it("preserves legacy analytics settings when the active controls are updated", async () => {
    createIsolatedBackendEnv();
    const { analyticsConfigRepository } = await import(
      "../src/repositories/jsonRepositories.js"
    );
    const { updateAnalyticsConfig } = await import("../src/services/analyticsService.js");

    analyticsConfigRepository.write({
      siteUrl: "https://rodogarcia.com.br",
      consent: { bannerEnabled: true, version: 2 },
      tracking: { enabled: true, heartbeatSeconds: 45, scrollMilestones: [25, 50] },
      providers: {
        ga4: { enabled: false, measurementId: "" },
        sentry: { enabled: true, dsn: "https://example.invalid/legacy" },
      },
      seo: { enableSearchConsole: true, sitemapUrl: "/sitemap.xml" },
    });

    const updated = updateAnalyticsConfig({
      tracking: { enabled: false, scrollMilestones: [50, 100] },
      providers: {
        ga4: { enabled: true, measurementId: "G-TEST123" },
      },
    });

    expect(updated).toMatchObject({
      siteUrl: "https://rodogarcia.com.br",
      consent: { bannerEnabled: true, version: 2 },
      tracking: { enabled: false, heartbeatSeconds: 45, scrollMilestones: [50, 100] },
      providers: {
        ga4: { enabled: true, measurementId: "G-TEST123" },
        sentry: { enabled: true, dsn: "https://example.invalid/legacy" },
      },
      seo: { enableSearchConsole: true, sitemapUrl: "/sitemap.xml" },
    });
  });
});
