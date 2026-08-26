import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getOwnedSite } from "@/lib/sites";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { LogoutButton } from "@/components/LogoutButton";

export default async function SiteDashboardPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const session = await getSession();
  if (!session) notFound();

  const { siteId } = await params;
  const site = getOwnedSite(siteId, session.userId);
  if (!site) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
            ← All sites
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{site.name}</h1>
          <p className="text-sm text-slate-500">{site.domain}</p>
        </div>
        <LogoutButton />
      </header>

      <AnalyticsDashboard siteId={site.id} publicKey={site.public_key} />
    </main>
  );
}
