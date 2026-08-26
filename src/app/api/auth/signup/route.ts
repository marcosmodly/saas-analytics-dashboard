import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/users";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash);
  await createSessionCookie({ userId: user.id, email: user.email });

  return NextResponse.json({ id: user.id, email: user.email });
}
