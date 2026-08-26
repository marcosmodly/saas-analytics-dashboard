import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-16 px-6 py-20">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">Pulse Analytics</span>
        <nav className="flex gap-3 text-sm font-medium">
          {session ? (
            <Link href="/dashboard" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="flex flex-col gap-6">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
          A self-hosted analytics platform for your own sites
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Drop a one-line tracking script into any site and get page views, visitors, referral
          sources, device/browser breakdowns, and conversion tracking — no cookies banner
          required, no data leaving your own database.
        </p>
        <div>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Create a free account
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-400">How it flows</p>
        <div className="flex flex-col items-center gap-2 text-lg font-semibold text-slate-800">
          <span>Visitors</span>
          <span className="text-slate-300">↓</span>
          <span>Sessions</span>
          <span className="text-slate-300">↓</span>
          <span>Pageviews</span>
          <span className="text-slate-300">↓</span>
          <span className="text-emerald-600">Conversions</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const FEATURES = [
  { title: "Multi-site dashboard", description: "Every account can track multiple sites, each with its own API key and stats." },
  { title: "Page views & visitors", description: "Unique visitors, sessions, and pageviews over the last 7, 30, or 90 days." },
  { title: "Referral sources", description: "See which sites are sending you traffic, with direct traffic broken out separately." },
  { title: "Device & browser stats", description: "A breakdown of the devices, browsers, and operating systems your visitors use." },
  { title: "Conversion tracking", description: "Fire window.trackEvent('signup') from any page to track goals alongside traffic." },
  { title: "One-line tracking script", description: "A single <script> tag with your site's public key — no cookie consent banner needed." },
];
