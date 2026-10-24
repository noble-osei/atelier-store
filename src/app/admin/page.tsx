import Link from "next/link";

import { ADMIN_SECTIONS } from "@/components/admin/sections";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/session";

// Every page under /admin calls requireAdmin first (see the layout).
// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminPage() {
  const { user } = await requireAdmin("/admin");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Overview" description={`Signed in as ${user.email}.`} />
      <ul className="border-t border-line">
        {ADMIN_SECTIONS.filter((section) => section.href !== "/admin").map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="flex items-center justify-between gap-4 border-b border-line py-5 hover:bg-surface"
            >
              <span className="flex flex-col gap-1">
                <span className="type-label">{section.label}</span>
                <span className="text-caption text-ink-muted">{section.description}</span>
              </span>
              <ArrowRightIcon className="size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
