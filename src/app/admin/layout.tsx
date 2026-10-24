import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

// Admin pages block on the role check instead of streaming a Suspense shell, so a
// signed-in non-admin gets a real 404 status. Do not add a loading.tsx or a
// <Suspense> boundary under this segment (`pnpm check:admin` enforces it).
export const instant = false;

// Static chrome shared by every /admin page. It reads no session and is NOT an
// authorization check: layouts do not re-run on every navigation, so each page and
// Server Action under /admin must call requireAdmin itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <section className="section container-content flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Admin</p>
        <h1 className="type-editorial text-display">Administration</h1>
      </header>
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-x-12">
        <AdminNav />
        <div className="flex min-w-0 flex-col gap-10">
          {children}
          <div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </section>
  );
}
