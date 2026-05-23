import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reject cross-origin writes (CSRF hardening). Same-origin browser fetches
// always send an Origin header matching the request host; an attacker page on
// another origin cannot forge a matching Origin.
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser/server-to-server calls
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// POST: Set the access_token cookie on the frontend domain
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const { accessToken } = await request.json();
  if (!accessToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });
  return response;
}

// DELETE: Clear the access_token cookie (logout)
export async function DELETE() {
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
