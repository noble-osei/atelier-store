import Link from "next/link";
import { Suspense } from "react";
import { navigation } from "@/lib/catalog";
import { CartCount } from "./cart/cart-count";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

// Sticky header: menu + nav | wordmark | search, account, bag.
// The mobile menu is a native popover, so it needs no client JavaScript.
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="flex items-center gap-6">
        <button
          type="button"
          popoverTarget="site-menu"
          className="-ml-3 inline-flex size-11 items-center justify-center lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <nav aria-label="Primary" className="flex items-center gap-6 max-lg:hidden">
          {navigation.slice(0, 4).map((item) => (
            <a key={item.label} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <Link
        href="/"
        className="type-editorial text-heading-sm tracking-[0.28em] uppercase md:text-heading"
        aria-label="Atelier, home"
      >
        Atelier
      </Link>

      <div className="flex items-center justify-end gap-1 md:gap-3">
        <Link
          href="/search"
          className="inline-flex size-11 items-center justify-center"
          aria-label="Search"
        >
          <SearchIcon />
        </Link>
        <Link
          href="/account"
          className="inline-flex size-11 items-center justify-center max-md:hidden"
          aria-label="Account"
        >
          <UserIcon />
        </Link>
        <Link
          href="/cart"
          className="relative -mr-3 inline-flex size-11 items-center justify-center"
        >
          <BagIcon />
          <span className="sr-only">Shopping bag</span>
          <Suspense fallback={null}>
            <CartCount />
          </Suspense>
        </Link>
      </div>

      <div
        id="site-menu"
        popover="auto"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-md bg-canvas p-0 text-ink shadow-overlay open:animate-fade-in backdrop:bg-scrim"
      >
        <div className="flex h-header items-center justify-between border-b border-line px-gutter">
          <span className="type-label">Menu</span>
          <button
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="hide"
            className="-mr-3 inline-flex size-11 items-center justify-center"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Mobile" className="px-gutter py-6">
          <ul className="flex flex-col">
            {navigation.map((item) => (
              <li key={item.label} className="border-b border-line">
                <a
                  href={item.href}
                  className="flex min-h-14 items-center text-heading-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-col gap-1">
            {[
              { label: "My account", href: "/account" },
              { label: "Wishlist", href: "#" },
              { label: "Client services", href: "#" },
              { label: "Store locator", href: "#" },
            ].map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="nav-link text-ink-muted">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
