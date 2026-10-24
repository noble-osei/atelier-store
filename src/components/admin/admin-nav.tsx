"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_SECTIONS } from "@/components/admin/sections";

// Side list on desktop, sideways-scrolling row on phones (same pattern as
// AccountNav). Hiding this nav from customers is cosmetic: every admin page and
// Server Action checks the role on the server.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="max-md:full-bleed">
      <ul className="scrollbar-none flex gap-6 overflow-x-auto max-md:px-gutter md:flex-col md:gap-0">
        {ADMIN_SECTIONS.map(({ label, href }) => {
          const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link href={href} aria-current={current ? "page" : undefined} className="nav-link">
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
