export type AnalyticsEventType =
  | "page_view"
  | "click"
  | "form_submit"
  | "modal_open"
  | "modal_close"
  | "carousel_advance"
  | "map_interaction"
  | "cta_click"
  | "external_link"
  | "scroll_depth";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  page: string;
  element?: string;
  value?: string | number;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  timestamp?: number;
}

export interface AnalyticsSession {
  id: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  timestamp: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  providers: {
    googleAnalytics?: { trackingId: string; enabled: boolean };
    hotjár?: { siteId: string; enabled: boolean };
  };
  consentRequired: boolean;
}

export interface AnalyticsStats {
  totalPageViews: number;
  uniqueSessions: number;
  topPages: Array<{ page: string; views: number }>;
  recentEvents: AnalyticsEvent[];
  period: { from: string; to: string };
}

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
}
