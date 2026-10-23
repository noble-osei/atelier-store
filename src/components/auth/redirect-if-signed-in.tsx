import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

// Sends people who are already signed in away from the sign-in/up pages.
// Reads the session, so render it inside <Suspense>.
export async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/account");
  return null;
}
