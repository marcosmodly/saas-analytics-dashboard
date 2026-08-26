import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnedSite } from "@/lib/sites";
import { computeStats } from "@/lib/events";

const VALID_RANGES = new Set(["7d", "30d", "90d"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { siteId } = await params;
  const site = getOwnedSite(siteId, session.userId);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "7d";
  const range = VALID_RANGES.has(rangeParam) ? rangeParam : "7d";

  return NextResponse.json(computeStats(site.id, range));
}
