import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CartLines } from "@/components/cart/cart-lines";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { CheckoutHold } from "@/components/cart/checkout-hold";
import { readCart } from "@/lib/cart-cookie";
import { getCartView } from "@/lib/cart-queries";
import { SHIPPING_CENTS, SHIPPING_LABEL } from "@/lib/checkout-config";
import { getPendingOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false },
};

// Static shell; the cart cookie and live prices stream in behind Suspense.
export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <div className="container-site pb-section">
      <h1 className="type-editorial py-8 text-display md:py-12">Shopping bag</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartContents searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CartContents({
  searchParams,
}: {
  searchParams: PageProps<"/cart">["searchParams"];
}) {
  // Stripe sends customers back with ?checkout=canceled when they leave its page.
  const { checkout } = await searchParams;
  const canceled = checkout === "canceled";

  // A signed-in customer may have an open checkout holding some of their items.
  // Those units are off the shelf, so add them back to the stock this bag shows.
  const session = await getSession();
  const pending = session ? await getPendingOrder(session.user.id) : undefined;
  const view = await getCartView(
    await readCart(),
    pending?.items.map((item) => ({
      slug: item.productSlug,
      size: item.size,
      quantity: item.quantity,
    })),
  );
  const hold = pending ? (
    <CheckoutHold
      canceled={canceled}
      minutesLeft={minutesUntil(pending.reservedUntil)}
    />
  ) : canceled ? (
    <p role="status" className="border border-line-strong p-4 text-body-sm">
      Checkout was canceled and nothing was charged. Your bag is unchanged.
    </p>
  ) : null;

  if (view.items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 border-t border-line py-12 md:py-16">
        {hold}
        <div className="flex flex-col gap-2">
          <h2 className="text-heading-sm">Your bag is empty.</h2>
          <p className="max-w-prose text-body text-ink-muted">
            Pieces you add are kept here for 30 days, on this device.
          </p>
        </div>
        <div className="flex flex-col gap-3 max-sm:w-full sm:flex-row">
          <Link href="/new-arrivals" className="btn btn-primary">
            Discover new arrivals
          </Link>
          <Link href="/search" className="btn btn-secondary">
            Search the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-6">
        {hold}
        {view.hasIssues ? (
          <p role="status" className="border border-line-strong p-4 text-body-sm">
            Stock has changed since you added some items. Your bag shows what is
            available now.
          </p>
        ) : null}
        <CartLines items={view.items} />
      </div>

      <aside
        aria-labelledby="summary-title"
        className="flex flex-col gap-4 self-start border border-line p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]"
      >
        <h2 id="summary-title" className="type-label">
          Order summary
        </h2>
        <p className="flex items-baseline justify-between text-body">
          <span>
            Subtotal ({view.units} {view.units === 1 ? "item" : "items"})
          </span>
          <span className="type-price">{formatPrice(view.subtotalCents / 100)}</span>
        </p>
        {view.subtotalCents > 0 ? (
          <>
            <p className="flex items-baseline justify-between text-body">
              <span>{SHIPPING_LABEL}</span>
              <span className="type-price">{formatPrice(SHIPPING_CENTS / 100)}</span>
            </p>
            <p className="flex items-baseline justify-between border-t border-line pt-4 text-body">
              <span>Total</span>
              <span className="type-price">
                {formatPrice((view.subtotalCents + SHIPPING_CENTS) / 100)}
              </span>
            </p>
          </>
        ) : null}
        <p className="text-caption text-ink-muted">
          Prices and availability are checked again before you pay. Payment is taken securely
          by Stripe.
        </p>
        <CheckoutButton disabled={view.hasIssues} />
        <Link href="/" className="btn btn-secondary btn-block">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function minutesUntil(date: Date) {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));
}

function CartSkeleton() {
  return (
    <div className="border-t border-line py-6" aria-busy="true">
      <span className="sr-only">Loading your bag</span>
      <div className="flex gap-4">
        <div className="media-product w-24 md:w-32" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-3 w-24 bg-surface" />
          <div className="h-5 w-2/3 bg-surface" />
          <div className="mt-4 h-control w-32 bg-surface" />
        </div>
      </div>
    </div>
  );
}
