import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic gate only: it checks that a session cookie exists, not that the
// session is valid or the user is an admin. Pages and Server Actions verify the
// real session (src/lib/session.ts).
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
