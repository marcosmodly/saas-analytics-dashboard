import { UAParser } from "ua-parser-js";
import { getDb } from "./db";
import type { BreakdownItem, ConversionSummary, EventType, SiteStats, TimeseriesPoint } from "./types";

export interface IngestParams {
  siteId: string;
  type: EventType;
  name?: string | null;
  url: string;
  referrer?: string | null;
  userAgent?: string | null;
  visitorId: string;
  sessionId: string;
}

export function insertEvent(params: IngestParams): void {
  const parsed = params.userAgent ? new UAParser(params.userAgent).getResult() : null;
  const device = parsed?.device.type ?? "desktop";
  const browser = parsed?.browser.name ?? "Unknown";
  const os = parsed?.os.name ?? "Unknown";

  getDb()
    .prepare(
      `INSERT INTO events (site_id, type, name, url, referrer, device, browser, os, visitor_id, session_id)
       VALUES (@site_id, @type, @name, @url, @referrer, @device, @browser, @os, @visitor_id, @session_id)`
    )
    .run({
      site_id: params.siteId,
      type: params.type,
      name: params.name ?? null,
      url: params.url,
      referrer: normalizeReferrer(params.referrer),
      device,
      browser,
      os,
      visitor_id: params.visitorId,
      session_id: params.sessionId,
    });
}

function normalizeReferrer(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function computeStats(siteId: string, range: string): SiteStats {
  const days = RANGE_DAYS[range] ?? 7;
  const db = getDb();
  const since = `-${days} days`;

  const totals = db
    .prepare(
      `SELECT
         COUNT(DISTINCT visitor_id) AS visitors,
         COUNT(DISTINCT session_id) AS sessions,
         SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
         SUM(CASE WHEN type = 'conversion' THEN 1 ELSE 0 END) AS conversions
       FROM events
       WHERE site_id = ? AND created_at >= datetime('now', ?)`
    )
    .get(siteId, since) as {
    visitors: number;
    sessions: number;
    pageviews: number | null;
    conversions: number | null;
  };

  const timeseriesRows = db
    .prepare(
      `SELECT
         date(created_at) AS date,
         COUNT(DISTINCT visitor_id) AS visitors,
         SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pageviews
       FROM events
       WHERE site_id = ? AND created_at >= datetime('now', ?)
       GROUP BY date(created_at)
       ORDER BY date(created_at) ASC`
    )
    .all(siteId, since) as TimeseriesPoint[];

  const topPages = db
    .prepare(
      `SELECT url AS label, COUNT(*) AS count
       FROM events
       WHERE site_id = ? AND type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY url
       ORDER BY count DESC
       LIMIT 10`
    )
    .all(siteId, since) as BreakdownItem[];

  const referrers = db
    .prepare(
      `SELECT COALESCE(referrer, 'Direct') AS label, COUNT(*) AS count
       FROM events
       WHERE site_id = ? AND type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY label
       ORDER BY count DESC
       LIMIT 10`
    )
    .all(siteId, since) as BreakdownItem[];

  const devices = db
    .prepare(
      `SELECT COALESCE(NULLIF(device, ''), 'desktop') AS label, COUNT(*) AS count
       FROM events
       WHERE site_id = ? AND type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY label
       ORDER BY count DESC`
    )
    .all(siteId, since) as BreakdownItem[];

  const browsers = db
    .prepare(
      `SELECT COALESCE(browser, 'Unknown') AS label, COUNT(*) AS count
       FROM events
       WHERE site_id = ? AND type = 'pageview' AND created_at >= datetime('now', ?)
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`
    )
    .all(siteId, since) as BreakdownItem[];

  const conversionsBreakdown = db
    .prepare(
      `SELECT COALESCE(name, 'unnamed') AS name, COUNT(*) AS count
       FROM events
       WHERE site_id = ? AND type = 'conversion' AND created_at >= datetime('now', ?)
       GROUP BY name
       ORDER BY count DESC`
    )
    .all(siteId, since) as ConversionSummary[];

  return {
    range,
    totals: {
      visitors: totals.visitors ?? 0,
      sessions: totals.sessions ?? 0,
      pageviews: totals.pageviews ?? 0,
      conversions: totals.conversions ?? 0,
    },
    timeseries: timeseriesRows,
    topPages,
    referrers,
    devices,
    browsers,
    conversionsBreakdown,
  };
}
