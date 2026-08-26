import { NextRequest, NextResponse } from "next/server";
import { getSiteByPublicKey } from "@/lib/sites";
import { insertEvent } from "@/lib/events";

// This endpoint is called from arbitrary third-party sites embedding the
// tracking snippet, so it's intentionally open (CORS: *) and unauthenticated
// beyond the per-site public key — the same trust model real analytics
// tracking pixels use (the key identifies the site, it isn't a secret).

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  let body: {
    siteKey?: string;
    type?: "pageview" | "conversion";
    name?: string;
    url?: string;
    referrer?: string;
    visitorId?: string;
    sessionId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: corsHeaders() });
  }

  const { siteKey, type, url, visitorId, sessionId } = body;

  if (!siteKey || !type || !url || !visitorId || !sessionId) {
    return NextResponse.json(
      { error: "siteKey, type, url, visitorId, and sessionId are required." },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (type !== "pageview" && type !== "conversion") {
    return NextResponse.json({ error: "type must be 'pageview' or 'conversion'." }, { status: 400, headers: corsHeaders() });
  }

  const site = getSiteByPublicKey(siteKey);
  if (!site) {
    return NextResponse.json({ error: "Unknown site key." }, { status: 404, headers: corsHeaders() });
  }

  insertEvent({
    siteId: site.id,
    type,
    name: body.name,
    url,
    referrer: body.referrer,
    userAgent: req.headers.get("user-agent"),
    visitorId,
    sessionId,
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
