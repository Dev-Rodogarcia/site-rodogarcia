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
});
