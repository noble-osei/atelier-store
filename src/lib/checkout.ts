import "server-only";

import type Stripe from "stripe";

import type { CartView } from "./cart";
import { revalidateProducts } from "./catalog-cache";
import {
  CHECKOUT_HOLD_MINUTES,
  CURRENCY,
  SHIPPING_CENTS,
  SHIPPING_COUNTRIES,
  SHIPPING_LABEL,
} from "./checkout-config";
import {
  attachCheckoutSession,
  getPendingOrder,
  markPaid,
  markRefundedForReview,
  releaseOrder,
  reserveOrder,
  type PaidDetails,
} from "./orders";
import { getSiteOrigin, getStripe } from "./stripe";

// Orchestration between the database (what we sell and what it costs) and
// Stripe (collecting the money). Called from Server Actions and Route
// Handlers only: it revalidates the product cache, which cannot happen
// while rendering.

/* Starting checkout ------------------------------------------------------ */

export type BeginResult =
  | { ok: true; url: string }
  | { ok: false; error: string; stockChanged?: boolean };

/**
 * Turns an already validated, database-priced cart into a held order and a
 * Stripe Checkout Session. Nothing in `view` comes from the browser except the
 * choice of product, size, color and quantity, and those were re-priced and
 * re-checked against live stock to build it.
 */
export async function beginCheckout(
  user: { id: string; email: string },
  view: CartView,
): Promise<BeginResult> {
  const reservedUntil = new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60_000);

  const reserved = await reserveOrder({
    userId: user.id,
    shippingCents: SHIPPING_CENTS,
    reservedUntil,
    items: view.items.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      reference: item.reference,
      name: item.name,
      size: item.size,
      color: item.color,
      unitPriceCents: item.unitCents,
      quantity: item.quantity,
    })),
  });
  if (!reserved.ok) {
    if (reserved.reason === "busy") {
      return { ok: false, error: "A checkout is already open. Try again in a moment." };
    }
    return {
      ok: false,
      error: "Some items sold out while you were checking out. Review your bag and try again.",
      stockChanged: true,
    };
  }
  revalidateProducts();

  const origin = getSiteOrigin();
  try {
    const session = await getStripe().checkout.sessions.create(
      {
        ui_mode: "hosted_page",
        mode: "payment",
        // Payment methods are managed in the Stripe Dashboard (this API version has
        // no payment_method_types). Delayed methods are safe to enable: their
        // async_payment_* events are handled.
        line_items: view.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: CURRENCY,
            unit_amount: item.unitCents,
            product_data: {
              name: item.name,
              description:
                [item.size === "One size" ? null : `Size ${item.size}`, item.color]
                  .filter(Boolean)
                  .join(" · ") || undefined,
              metadata: { reference: item.reference },
            },
          },
        })),
        shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: SHIPPING_LABEL,
              fixed_amount: { amount: SHIPPING_CENTS, currency: CURRENCY },
            },
          },
        ],
        customer_email: user.email,
        client_reference_id: reserved.publicId,
        metadata: { order_id: reserved.publicId },
        payment_intent_data: { metadata: { order_id: reserved.publicId } },
        expires_at: Math.floor(reservedUntil.getTime() / 1000),
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart?checkout=canceled`,
      },
      { idempotencyKey: `checkout-${reserved.publicId}` },
    );
    if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL");

    // If this write fails the webhook still finds the order via client_reference_id.
    await attachCheckoutSession(reserved.publicId, session.id);
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("Could not create the Stripe Checkout Session", error);
    if (await releaseOrder(reserved.publicId, "expired")) revalidateProducts();
    return { ok: false, error: "We could not start checkout. Please try again." };
  }
}

/* Settling --------------------------------------------------------------- */

export type SettleOutcome =
  | "paid"
  | "already_paid"
  | "released"
  | "pending"
  | "mismatch"
  | "refunded"
  | "unknown_order";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function orderIdOf(session: Stripe.Checkout.Session) {
  const id = session.client_reference_id ?? session.metadata?.order_id ?? null;
  return id && UUID.test(id) ? id : null;
}

function paidDetails(session: Stripe.Checkout.Session): PaidDetails {
  const shipping = session.collected_information?.shipping_details ?? null;
  const intent = session.payment_intent;
  return {
    sessionId: session.id,
    paymentIntentId: typeof intent === "string" ? intent : (intent?.id ?? null),
    currency: session.currency ?? "",
    amountSubtotal: session.amount_subtotal ?? -1,
    amountShipping: session.total_details?.amount_shipping ?? -1,
    amountTotal: session.amount_total ?? -1,
    email: session.customer_details?.email ?? session.customer_email ?? null,
    shippingName: shipping?.name ?? null,
    shippingAddress: shipping
      ? {
          line1: shipping.address.line1 ?? "",
          line2: shipping.address.line2 ?? null,
          city: shipping.address.city ?? "",
          state: shipping.address.state ?? null,
          postalCode: shipping.address.postal_code ?? "",
          country: shipping.address.country ?? "",
        }
      : null,
  };
}

/**
 * Brings the order for a Checkout Session in line with what Stripe says right
 * now. Pass a Session freshly retrieved from Stripe (or from a verified
 * webhook): the order is only ever marked paid because Stripe reports it paid.
 * Safe to call any number of times, from any entry point.
 */
export async function settleSession(
  session: Stripe.Checkout.Session,
): Promise<SettleOutcome> {
  const publicId = orderIdOf(session);
  if (!publicId) return "unknown_order";

  if (session.payment_status === "paid") {
    const result = await markPaid(publicId, paidDetails(session));
    if (result.outcome === "paid") {
      if (result.stockChanged) revalidateProducts();
      return "paid";
    }
    if (result.outcome === "needs_refund") {
      // The hold ended and the units were sold on: give the customer their money back.
      const details = paidDetails(session);
      if (details.paymentIntentId) {
        await getStripe().refunds.create(
          { payment_intent: details.paymentIntentId },
          { idempotencyKey: `refund-${publicId}` },
        );
        await markRefundedForReview(publicId, "paid_after_expiry_refunded");
      } else {
        await markRefundedForReview(publicId, "paid_after_expiry_needs_manual_refund");
      }
      return "refunded";
    }
    return result.outcome;
  }

  if (session.status === "expired") {
    if (await releaseOrder(publicId, "expired")) revalidateProducts();
    return "released";
  }

  // Open, or complete with a delayed payment method still processing: keep the hold.
  return "pending";
}

/** A delayed payment method failed: the hold ends and the units go back on sale. */
export async function failSession(session: Stripe.Checkout.Session) {
  const publicId = orderIdOf(session);
  if (!publicId || session.payment_status === "paid") return;
  if (await releaseOrder(publicId, "failed")) revalidateProducts();
}

export async function settleSessionById(sessionId: string) {
  return settleSession(await getStripe().checkout.sessions.retrieve(sessionId));
}

/* Ending an open checkout ------------------------------------------------ */

/**
 * Closes the customer's open checkout, if any: expires the Stripe session so it
 * can no longer be paid, then settles from Stripe's answer. A session that was
 * paid in the meantime is marked paid instead of released.
 */
export async function closePendingCheckout(
  userId: string,
): Promise<{ outcome: SettleOutcome | "none"; sessionId: string | null }> {
  const order = await getPendingOrder(userId);
  if (!order) return { outcome: "none", sessionId: null };

  const sessionId = order.stripeCheckoutSessionId;
  if (!sessionId) {
    // No session yet: either creation is in flight or it failed half way.
    if (Date.now() - order.createdAt.getTime() < 2 * 60_000) {
      return { outcome: "pending", sessionId };
    }
    if (await releaseOrder(order.publicId, "expired")) revalidateProducts();
    return { outcome: "released", sessionId };
  }

  const stripe = getStripe();
  let session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "open") {
    try {
      session = await stripe.checkout.sessions.expire(sessionId);
    } catch {
      // Completed or expired a moment ago: settle from whatever it is now.
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }
  }
  return { outcome: await settleSession(session), sessionId };
}
