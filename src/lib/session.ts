import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

// Data access layer for auth. Reads the session cookie, so callers must sit
// behind <Suspense> (Cache Components) and must never be wrapped in "use cache".
// Server Actions and Route Handlers have to call requireUser/requireAdmin
// themselves: the proxy and page checks are not authorization for them.

// One database read per request, however many components ask.
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// The admin plugin allows comma-separated roles ("admin,editor").
export function isAdmin(user: { role?: string | null }) {
  return (user.role ?? "").split(",").includes("admin");
}

export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return session;
}

// Signed-in non-admins get a 404 so the admin area is not advertised.
export async function requireAdmin(returnTo: string) {
  const session = await requireUser(returnTo);
  if (!isAdmin(session.user)) notFound();
  return session;
}
