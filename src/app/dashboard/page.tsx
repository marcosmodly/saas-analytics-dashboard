import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listSitesForUser } from "@/lib/sites";
import { CreateSiteForm } from "@/components/CreateSiteForm";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await getSession();
  const sites = session ? listSitesForUser(session.userId) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your sites</h1>
          <p className="text-sm text-slate-500">{session?.email}</p>
        </div>
        <LogoutButton />
      </header>

      {sites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
          No sites yet — add one below to get a tracking snippet and start seeing data.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/dashboard/${site.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300"
              >
                <div>
                  <p className="font-semibold text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-500">{site.domain}</p>
                </div>
                <span className="text-sm text-slate-400">View stats →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateSiteForm />
    </main>
  );
}
