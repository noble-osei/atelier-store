"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Personal details", href: "/account/details" },
];

// Side list on desktop, sideways-scrolling row on phones (same pattern as
// CategoryNav). The overview only matches exactly so it is not "current" on
// every sub-page.
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="max-md:full-bleed">
      <ul className="scrollbar-none flex gap-6 overflow-x-auto max-md:px-gutter md:flex-col md:gap-0">
        {items.map(({ label, href }) => {
          const current = href === "/account" ? pathname === href : pathname.startsWith(href);
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
