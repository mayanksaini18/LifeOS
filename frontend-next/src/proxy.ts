import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/welcome", "/login", "/register", "/phone-login"];

function isTokenValid(tokenValue: string): boolean {
  try {
    const payload = JSON.parse(atob(tokenValue.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.\w+$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token");
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) {
    // Only redirect authenticated users away from auth pages if token is valid
    if (token && isTokenValid(token.value)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — must have a valid token
  if (!token) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (!isTokenValid(token.value)) {
    // Clear the stale cookie and redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("expired", "true");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
