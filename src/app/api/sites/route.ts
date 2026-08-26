import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSite, listSitesForUser } from "@/lib/sites";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  return NextResponse.json(listSitesForUser(session.userId));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { name?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const domain = body.domain?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!name) return NextResponse.json({ error: "Site name is required." }, { status: 400 });
  if (!domain) return NextResponse.json({ error: "Domain is required." }, { status: 400 });

  const site = createSite(session.userId, name, domain);
  return NextResponse.json(site);
}
