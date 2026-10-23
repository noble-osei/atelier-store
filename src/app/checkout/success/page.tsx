import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { getCartProducts } from "@/lib/cart-queries";
import { getOrderForSession } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false },
};

// Static shell; the session and order stream in behind Suspense. This page only
// shows what the database says. It never marks an order paid: arriving here
// proves nothing, so <ConfirmPayment> asks the server to check with Stripe.
export default function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  return (
    <div className="container-site pb-section">
      <Suspense fallback={<ConfirmationSkeleton />}>
        <OrderStatus searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderStatus({
  searchParams,
}: {
  searchParams: PageProps<"/checkout/success">["searchParams"];
}) {
  const { session_id } = await searchParams;
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id;
  if (!sessionId || !/^cs_[A-Za-z0-9_]{1,250}$/.test(sessionId)) notFound();

  const { user } = await requireUser(
    `/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
  );
  // Scoped to the signed-in customer: someone else's session id finds nothing.
  const order = await getOrderForSession(user.id, sessionId);
  if (!order) notFound();

  // Photography for the order lines, from the catalog as it is now.
  const catalog = await getCartProducts(order.items.map((item) => item.productSlug));
  const images = Object.fromEntries(
    [...catalog].map(([slug, product]) => [slug, product.image]),
  );

  return <OrderConfirmation order={order} sessionId={sessionId} images={images} />;
}

function ConfirmationSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading your order</span>
      <div className="py-8 md:py-12">
        <div className="h-12 w-2/3 max-w-md bg-surface" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-4">
          <div className="h-16 max-w-prose bg-surface" />
          <div className="h-4 w-32 bg-surface" />
          <div className="h-20 border-t border-line bg-surface" />
        </div>
        <div className="h-48 bg-surface" />
      </div>
    </div>
  );
}
