"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { SiteStats } from "@/lib/types";

const RANGES: { value: string; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export function AnalyticsDashboard({ siteId, publicKey }: { siteId: string; publicKey: string }) {
  const [range, setRange] = useState("7d");
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);

  const snippet = `<script defer src="${typeof window !== "undefined" ? window.location.origin : ""}/track.js" data-site="${publicKey}"></script>`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/sites/${siteId}/stats?range=${range}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load stats.");
        if (!cancelled) {
          setStats(data as SiteStats);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [siteId, range]);

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 1500);
    } catch {
      // clipboard unavailable — the snippet is still selectable in the <code> block
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Tracking snippet</h2>
          <button
            onClick={copySnippet}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {snippetCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <code className="overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          {snippet}
        </code>
        <p className="text-xs text-slate-500">
          Paste this in your site&apos;s <code>&lt;head&gt;</code>. Call{" "}
          <code>window.trackEvent(&quot;signup&quot;)</code> anywhere to record a conversion.
        </p>
      </section>

      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              range === r.value
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!stats && !error && <p className="text-sm text-slate-500">Loading stats…</p>}

      {stats && (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Visitors" value={stats.totals.visitors} />
            <StatCard label="Sessions" value={stats.totals.sessions} />
            <StatCard label="Pageviews" value={stats.totals.pageviews} />
            <StatCard label="Conversions" value={stats.totals.conversions} accent />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Visitors & pageviews</h2>
            {stats.timeseries.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#0f172a" strokeWidth={2} dot={false} name="Visitors" />
                  <Line type="monotone" dataKey="pageviews" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Pageviews" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BreakdownCard title="Top pages" items={stats.topPages} />
            <BreakdownCard title="Referral sources" items={stats.referrers} />
            <BreakdownCard title="Devices" items={stats.devices} />
            <BreakdownCard title="Browsers" items={stats.browsers} />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Conversions</h2>
            {stats.conversionsBreakdown.length === 0 ? (
              <EmptyState text="No conversions tracked yet in this range." />
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.conversionsBreakdown.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{c.name}</span>
                    <span className="font-semibold text-emerald-700">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-emerald-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-slate-700">{item.label}</span>
                <span className="font-medium text-slate-500">{item.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-slate-800"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ text = "No data yet for this range." }: { text?: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}
