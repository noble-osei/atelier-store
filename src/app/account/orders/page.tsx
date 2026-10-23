import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  OrderStatusBadge,
  formatOrderDate,
  orderNumber,
} from "@/components/account/order-status";
import { ArrowRightIcon } from "@/components/icons";
import { getOrdersForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order history",
  robots: { index: false },
};

// Static shell; the session and orders stream in behind Suspense. Every page
// under /account must call requireUser itself.
export default function AccountOrdersPage() {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="type-editorial text-heading">Order history</h2>
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

async function OrderList() {
  const { user } = await requireUser("/account/orders");
  // Scoped to the signed-in customer by user_id.
  const orders = await getOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 border-y border-line py-10">
        <p className="max-w-prose text-body-lg text-ink-muted">
          You have not placed any orders yet.
        </p>
        <Link href="/new-arrivals" className="btn btn-primary">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="border-t border-line">
      {orders.map((order) => {
        const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return (
          <li key={order.publicId}>
            <Link
              href={`/account/orders/${order.publicId}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_9.5rem_6rem_1.25rem] sm:gap-x-8 hover:bg-surface"
            >
              <span className="flex min-w-0 flex-col gap-1 sm:order-1">
                <span className="type-price text-body-lg">
                  <span className="sr-only">Order </span>
                  {orderNumber(order.publicId)}
                </span>
                <span className="text-caption text-ink-muted">
                  <time dateTime={order.createdAt.toISOString()}>
                    {formatOrderDate(order.createdAt)}
                  </time>
                  {" · "}
                  {units} {units === 1 ? "piece" : "pieces"}
                </span>
              </span>
              <span className="type-price justify-self-end text-body-lg sm:order-3">
                {formatPrice(order.totalCents / 100)}
              </span>
              <span className="justify-self-start sm:order-2">
                <OrderStatusBadge order={order} />
              </span>
              <span className="flex items-center justify-self-end gap-2 text-caption sm:order-4">
                <span className="sm:sr-only">View details</span>
                <ArrowRightIcon className="size-5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function OrderListSkeleton() {
  return (
    <div className="flex flex-col border-t border-line" aria-busy="true">
      <span className="sr-only">Loading your orders</span>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="border-b border-line py-5">
          <div className="h-11 w-full bg-surface" />
        </div>
      ))}
    </div>
  );
}
