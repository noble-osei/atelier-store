import type { Metadata } from "next";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

// Deliberately blocking (no Suspense shell): the role is checked before any
// response is streamed, so signed-in non-admins get a real 404 status instead of
// a 200 with a not-found body. Every admin page and Server Action must call
// requireAdmin itself.
export const instant = false;

export default async function AdminPage() {
  const { user } = await requireAdmin("/admin");

  return (
    <section className="section container-prose flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Admin</p>
        <h1 className="type-editorial text-display">Administration</h1>
      </header>
      <p className="text-body text-ink-muted">
        Signed in as {user.email}. Admin tools will live here.
      </p>
    </section>
  );
}
