import Link from "next/link";
import type { ReactNode } from "react";

import type { Image as ProductImage } from "@/lib/images";
import { formatPrice } from "@/lib/products";
import { CheckIcon } from "../icons";
import { ConfirmPayment } from "./confirm-payment";
import { OrderLines } from "./order-lines";

// What the confirmation page shows, decided only from the stored order. The
// browser arriving here proves nothing: "paid" appears only once the order row
// says so, and <ConfirmPayment> asks the server to check with Stripe.

export type OrderView = {
  publicId: string;
  paymentStatus: "pending" | "paid" | "failed" | "expired";
  /** Set when a person has to look at the order (see src/lib/orders.ts). */
  needsReviewReason: string | null;
  email: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingName: string | null;
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string;
  } | null;
  items: {
    id: number;
    productSlug: string;
    name: string;
    size: string;
    color: string | null;
    quantity: number;
    unitPriceCents: number;
  }[];
};

export type Stage =
  | "paid"
  | "pending"
  | "reviewing"
  | "refunded"
  | "refund_due"
  | "expired"
  | "failed";

/**
 * One stage per order, so the headline, the message and the polling agree.
 * A paid-after-expiry order is stored as expired or failed, and a payment that
 * did not match stays pending, so the review flag has to be read as well.
 */
export function orderStage(order: Pick<OrderView, "paymentStatus" | "needsReviewReason">): Stage {
  const reason = order.needsReviewReason;
  if (order.paymentStatus === "paid") return "paid";
  if (order.paymentStatus === "pending") {
    return reason === "payment_does_not_match_order" ? "reviewing" : "pending";
  }
  if (reason === "paid_after_expiry_refunded") return "refunded";
  if (reason === "paid_after_expiry_needs_manual_refund") return "refund_due";
  return order.paymentStatus;
}

export const COPY: Record<
  Stage,
  { eyebrow: string; title: string; body: string; tone: "default" | "danger" }
> = {
  paid: { eyebrow: "Payment confirmed", title: "Thank you for your order", body: "", tone: "default" },
  pending: {
    eyebrow: "Awaiting confirmation",
    title: "Confirming your payment",
    body: "We are waiting for the payment to be confirmed. This usually takes a few seconds, and this page updates on its own. Please do not pay again.",
    tone: "default",
  },
  reviewing: {
    eyebrow: "Under review",
    title: "We are checking your payment",
    body: "The amount we received did not match your order, so we paused it for a manual check. You have not been charged twice. Keep the order number below if you contact us.",
    tone: "danger",
  },
  refunded: {
    eyebrow: "Refunded",
    title: "Your payment was refunded",
    body: "Your payment arrived after your items were released, and they sold out in the meantime. We have refunded you in full. It can take 5 to 10 business days to show on your statement.",
    tone: "danger",
  },
  refund_due: {
    eyebrow: "Refund on its way",
    title: "Your payment is being refunded",
    body: "Your payment arrived after your items were released, and they sold out in the meantime. We will refund you in full by hand. Keep the order number below if you contact us.",
    tone: "danger",
  },
  expired: {
    eyebrow: "Not completed",
    title: "Order not completed",
    body: "This checkout expired before it was paid, so nothing was charged and the items were released.",
    tone: "default",
  },
  failed: {
    eyebrow: "Not completed",
    title: "Order not completed",
    body: "The payment did not go through, so nothing was charged and the items were released.",
    tone: "danger",
  },
};

export function OrderConfirmation({
  order,
  sessionId,
  images,
}: {
  order: OrderView;
  sessionId: string;
  /** Catalog photography by product slug; a missing one shows a plain frame. */
  images: Record<string, ProductImage>;
}) {
  const stage = orderStage(order);
  const copy = COPY[stage];
  const paid = stage === "paid";
  const orderNumber = order.publicId.slice(0, 8).toUpperCase();
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="flex max-w-3xl flex-col gap-4 py-8 md:py-12">
        <p className="type-eyebrow">
          {paid ? (
            <span className="inline-flex items-center gap-2 text-success">
              <CheckIcon className="size-4" />
              {copy.eyebrow}
            </span>
          ) : (
            copy.eyebrow
          )}
        </p>
        <h1 className="type-editorial text-heading">{copy.title}</h1>
        {paid ? (
          <p className="max-w-prose text-body-lg text-ink-muted">
            {order.email
              ? `A receipt is on its way to ${order.email}.`
              : "Your payment has been received."}
          </p>
        ) : (
          <div
            role="status"
            aria-busy={stage === "pending"}
            className="flex max-w-prose items-start gap-4 border border-line-strong p-4"
          >
            {stage === "pending" ? (
              <span aria-hidden className="mt-1.5 size-2 shrink-0 animate-pulse bg-ink" />
            ) : null}
            <p className={`text-body-sm ${copy.tone === "danger" ? "text-danger" : ""}`}>
              {copy.body}
            </p>
          </div>
        )}
      </header>

      {stage === "pending" || paid ? <ConfirmPayment sessionId={sessionId} /> : null}

      <dl className="mb-10 grid divide-line border-y border-line max-md:divide-y md:mb-12 md:grid-cols-3 md:divide-x">
        <Detail label="Order number">
          <span className="type-price">{orderNumber}</span>
        </Detail>
        <Detail label="Items">
          {units} {units === 1 ? "piece" : "pieces"}
        </Detail>
        {paid && order.shippingAddress ? (
          <Detail label="Delivering to">
            <address className="not-italic">
              {order.shippingName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.postalCode} {order.shippingAddress.city},{" "}
              {order.shippingAddress.country}
            </address>
          </Detail>
        ) : (
          <Detail label="Total">
            <span className="type-price">{formatPrice(order.totalCents / 100)}</span>
          </Detail>
        )}
      </dl>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="type-label pb-4">
            Your order
          </h2>
          <OrderLines items={order.items} images={images} />
        </section>

        <aside
          aria-labelledby="totals-title"
          className="flex flex-col gap-4 self-start border border-line p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]"
        >
          <h2 id="totals-title" className="type-label">
            Order summary
          </h2>
          <p className="flex items-baseline justify-between text-body">
            <span>Subtotal</span>
            <span className="type-price">{formatPrice(order.subtotalCents / 100)}</span>
          </p>
          <p className="flex items-baseline justify-between text-body">
            <span>Shipping</span>
            <span className="type-price">{formatPrice(order.shippingCents / 100)}</span>
          </p>
          <p className="flex items-baseline justify-between border-t border-line pt-4 text-body-lg">
            <span>{paid ? "Total paid" : "Total"}</span>
            <span className="type-price">{formatPrice(order.totalCents / 100)}</span>
          </p>
          {paid ? (
            <>
              <Link href="/new-arrivals" className="btn btn-primary btn-block mt-2">
                Continue shopping
              </Link>
              <Link href="/account" className="btn btn-secondary btn-block">
                View your account
              </Link>
            </>
          ) : (
            <Link href="/cart" className="btn btn-secondary btn-block mt-2">
              Back to your bag
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-5 text-body-sm md:px-6 md:first:pl-0 md:last:pr-0">
      <dt className="type-eyebrow">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
