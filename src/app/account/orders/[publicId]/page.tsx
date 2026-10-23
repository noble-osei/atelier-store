import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailList } from "@/components/account/detail-list";
import {
  OrderStatusBadge,
  formatOrderDate,
  orderNumber,
} from "@/components/account/order-status";
import { COPY, orderStage } from "@/components/checkout/order-confirmation";
import { OrderLines } from "@/components/checkout/order-lines";
import { getCartProducts } from "@/lib/cart-queries";
import { getOrderForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deliberately blocking (no Suspense shell): the order is looked up, scoped to the
// signed-in customer, before any response is streamed. Someone else's order id (or
// one that does not exist) gets a real 404 status, and nothing about it is sent.
// Every page under /account must call requireUser itself.
export const instant = false;

export default async function AccountOrderPage({
  params,
}: PageProps<"/account/orders/[publicId]">) {
  const { publicId } = await params;
  // A malformed id would make Postgres reject the uuid comparison.
  if (!UUID.test(publicId)) notFound();

  const { user } = await requireUser(`/account/orders/${publicId}`);
  // Scoped to the signed-in customer: another customer's order id finds nothing.
  const order = await getOrderForUser(user.id, publicId);
  if (!order) notFound();

  // Photography for the order lines, from the catalog as it is now.
  const catalog = await getCartProducts(order.items.map((item) => item.productSlug));
  const images = Object.fromEntries(
    [...catalog].map(([slug, product]) => [slug, product.image]),
  );

  const stage = orderStage(order);
  const paid = stage === "paid";
  const address = order.shippingAddress;

  const details = [
    { label: "Order date", value: formatOrderDate(order.createdAt) },
    ...(order.paidAt ? [{ label: "Paid on", value: formatOrderDate(order.paidAt) }] : []),
    ...(paid && address
      ? [
          {
            label: "Delivering to",
            value: [
              order.shippingName,
              [address.line1, address.line2].filter(Boolean).join(", "),
              `${address.postalCode} ${address.city}`,
              address.country,
            ]
              .filter(Boolean)
              .join(", "),
          },
        ]
      : []),
    ...(order.email ? [{ label: "Email", value: order.email }] : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <Link href="/account/orders" className="link-quiet self-start text-body-sm">
        All orders
      </Link>
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Order</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Sans, not the editorial serif: its old-style numerals make 0 look like "o". */}
          <h2 className="type-price text-heading">
            {orderNumber(order.publicId)}
          </h2>
          <OrderStatusBadge order={order} />
        </div>
        {paid ? null : (
          <div role="status" className="flex max-w-prose flex-col items-start gap-4 border border-line-strong p-4">
            <p className={`text-body-sm ${COPY[stage].tone === "danger" ? "text-danger" : ""}`}>
              {stage === "pending"
                ? "We are waiting for the payment to be confirmed. Please do not pay again."
                : COPY[stage].body}
            </p>
            {stage === "pending" && order.stripeCheckoutSessionId ? (
              <Link
                href={`/checkout/success?session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}`}
                className="btn btn-secondary btn-sm"
              >
                Check payment status
              </Link>
            ) : null}
          </div>
        )}
      </header>

      <DetailList items={details} />

      <section aria-labelledby="order-items-title" className="flex flex-col gap-4">
        <h3 id="order-items-title" className="type-label">
          Items
        </h3>
        <OrderLines items={order.items} images={images} />
      </section>

      <section
        aria-labelledby="order-totals-title"
        className="flex flex-col gap-4 border border-line p-6 md:min-w-80 md:self-start"
      >
        <h3 id="order-totals-title" className="type-label">
          Order summary
        </h3>
        <p className="flex items-baseline justify-between gap-8 text-body">
          <span>Subtotal</span>
          <span className="type-price">{formatPrice(order.subtotalCents / 100)}</span>
        </p>
        <p className="flex items-baseline justify-between gap-8 text-body">
          <span>Shipping</span>
          <span className="type-price">{formatPrice(order.shippingCents / 100)}</span>
        </p>
        <p className="flex items-baseline justify-between gap-8 border-t border-line pt-4 text-body-lg">
          <span>{paid ? "Total paid" : "Total"}</span>
          <span className="type-price">{formatPrice(order.totalCents / 100)}</span>
        </p>
      </section>
    </div>
  );
}
