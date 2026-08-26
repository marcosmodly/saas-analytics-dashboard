# Pulse Analytics

A small, self-hosted, multi-tenant analytics platform — the kind of product a real SaaS analytics tool is built from, end to end: accounts, a per-site tracking script, an ingestion API, and a dashboard with charts.

```
Visitors
   ↓
Sessions
   ↓
Pageviews
   ↓
Conversions
```

## What it does

Sign up, add a site, and you get a one-line tracking snippet and a dashboard for it:

- **Multi-site accounts** — one login, multiple sites, each with its own API key and its own stats
- **Page views & visitors** — unique visitors, sessions, and pageviews charted over 7/30/90-day ranges
- **Referral sources** — which sites send traffic, with direct traffic broken out
- **Device & browser stats** — a breakdown of devices, browsers, and operating systems, parsed from each request's user agent
- **Conversion tracking** — call `window.trackEvent("signup")` from any page to record a named goal alongside traffic
- **A real ingestion API** — `/api/collect` is a CORS-open endpoint any site can POST to, the same trust model real tracking pixels use (the site's public key identifies it, it isn't a secret)
- **Its own auth** — email/password signup and login, hashed with bcrypt, sessions as signed JWT cookies verified in a `proxy.ts` route guard

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + SQLite (via `better-sqlite3`) + Recharts, with `jose` for session tokens and `bcryptjs` for password hashing.

The database is a single file, `data.db`, created automatically on first run — clone the repo, `npm install`, `npm run dev`, and it works with zero external services. No Postgres connection string to provision, no ORM migration step to run first.

## Running it locally

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET — any long random string
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, add a site, and copy the tracking snippet it gives you:

```html
<script defer src="http://localhost:3000/track.js" data-site="pk_your_key"></script>
```

Drop that on any page (a static HTML file works fine for testing) and refresh the dashboard — pageviews show up within a second.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | Yes | Signs session cookies. Generate one with `openssl rand -base64 32`. |
| `DB_PATH` | No | Override where the SQLite file is written. Defaults to `./data.db`. |

## How it's structured

```
src/
  proxy.ts                        # route guard: redirects unauthenticated /dashboard requests to /login
  app/
    api/
      auth/{signup,login,logout}/route.ts   # session cookie issuing/clearing
      sites/route.ts                          # list/create sites for the logged-in user
      sites/[siteId]/stats/route.ts             # aggregated stats for one site (auth + ownership checked)
      collect/route.ts                          # public, CORS-open ingestion endpoint
    dashboard/page.tsx                # site list + create-site form
    dashboard/[siteId]/page.tsx         # one site's analytics dashboard
    login/, signup/                       # auth pages
  lib/
    db.ts             # SQLite connection + schema migration (idempotent, runs on first query)
    auth.ts             # password hashing, JWT session cookie helpers
    users.ts, sites.ts    # data access
    events.ts               # event ingestion + the stats aggregation queries
    types.ts                  # shared types
  components/
    AnalyticsDashboard.tsx   # charts, breakdowns, range switcher, tracking snippet
    CreateSiteForm.tsx, AuthForm.tsx, LogoutButton.tsx
public/
  track.js   # the tracking snippet itself — pageviews, SPA route-change tracking, window.trackEvent()
```

## Notes

- `track.js` reads its own `data-site` attribute and posts to whatever origin it was loaded from, so the same script works regardless of which domain the analytics app is deployed to.
- Visitor and session IDs are random strings stored in `localStorage`/`sessionStorage` on the tracked site — no cookies are set on your visitors, and nothing is fingerprinted.
- The `/api/sites/[siteId]/stats` endpoint checks that the requesting user actually owns the site before returning anything; `/api/collect` has no such check by design since it's the public ingestion path, and instead validates the site's public key.
