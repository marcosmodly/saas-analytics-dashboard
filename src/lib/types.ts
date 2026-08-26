export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  public_key: string;
  created_at: string;
}

export type EventType = "pageview" | "conversion";

export interface AnalyticsEvent {
  id: number;
  site_id: string;
  type: EventType;
  name: string | null;
  url: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  visitor_id: string;
  session_id: string;
  created_at: string;
}

export interface TimeseriesPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface ConversionSummary {
  name: string;
  count: number;
}

export interface SiteStats {
  range: string;
  totals: {
    visitors: number;
    sessions: number;
    pageviews: number;
    conversions: number;
  };
  timeseries: TimeseriesPoint[];
  topPages: BreakdownItem[];
  referrers: BreakdownItem[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  conversionsBreakdown: ConversionSummary[];
}
