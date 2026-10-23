"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";

import { CART_COOKIE_CLEARED_ORDER, removePurchased } from "@/lib/cart";
import { readCart, writeCart } from "@/lib/cart-cookie";
import { getCartView } from "@/lib/cart-queries";
import { CART_CLEAR_WINDOW_MINUTES } from "@/lib/checkout-config";
import {
  beginCheckout,
  closePendingCheckout,
  settleSession,
  settleSessionById,
} from "@/lib/checkout";
import { getOrderForSession, getPendingOrder } from "@/lib/orders";
import { requireUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

// Checkout Server Actions. Every one calls requireUser itself and scopes its
// reads to that customer. Arguments are untrusted: the browser only ever says
// "check out my bag"; what is in it and what it costs is read on the server.

export type CheckoutState = { error: string | null };

export async function startCheckout(): Promise<CheckoutState> {
  const { user } = await requireUser("/cart");

  // An older open checkout holds stock and is limited to one per customer, so
  // end it first. If it turns out to have been paid, show that order instead.
  const previous = await closePendingCheckout(user.id);
  if (previous.outcome === "paid" || previous.outcome === "already_paid") {
    if (previous.sessionId) {
      redirect(`/checkout/success?session_id=${encodeURIComponent(previous.sessionId)}`);
    }
  }
  if (previous.outcome === "pending") {
    return { error: "Your previous payment is still being confirmed. Try again shortly." };
  }

  // Re-price and re-check the bag against the database as it is right now.
  const lines = await readCart();
  const view = await getCartView(lines);
  if (view.items.length === 0 || view.items.length !== lines.length || view.hasIssues) {
    refresh();
    return {
      error:
        view.items.length === 0
          ? "Your bag is empty."
          : "Stock or prices changed. Review your bag before checking out.",
    };
  }

  const result = await beginCheckout({ id: user.id, email: user.email }, view);
  if (!result.ok) {
    if (result.stockChanged) refresh();
    return { error: result.error };
  }
  redirect(result.url);
}

/** Releases the customer's held items and closes their open payment page. */
export async function releaseCheckout(): Promise<void> {
  const { user } = await requireUser("/cart");
  const closed = await closePendingCheckout(user.id);
  if (closed.outcome === "paid" || closed.outcome === "already_paid") {
    if (closed.sessionId) {
      redirect(`/checkout/success?session_id=${encodeURIComponent(closed.sessionId)}`);
    }
  }
  refresh();
}

/** Sends the customer back to their still-open Stripe payment page. */
export async function resumeCheckout(): Promise<void> {
  const { user } = await requireUser("/cart");
  const order = await getPendingOrder(user.id);

  if (order?.stripeCheckoutSessionId) {
    const session = await getStripe().checkout.sessions.retrieve(
      order.stripeCheckoutSessionId,
    );
    if (session.status === "open" && session.url) redirect(session.url);
    // Not open any more: bring the order in line with Stripe, then show the bag.
    await settleSession(session);
  }
  refresh();
}

export type ConfirmResult = {
  status: "pending" | "paid" | "failed" | "expired" | "unknown";
};

/**
 * Called by the success page. The browser reaching that page proves nothing, so
 * this asks Stripe, server to server, what happened to the customer's own
 * Checkout Session and lets settleSession decide. When the order is paid it
 * also removes the bought items from the bag.
 */
export async function confirmCheckout(sessionId: unknown): Promise<ConfirmResult> {
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]{1,250}$/.test(sessionId)) {
    return { status: "unknown" };
  }
  const { user } = await requireUser(
    `/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
  );

  let order = await getOrderForSession(user.id, sessionId);
  if (!order) return { status: "unknown" };

  let changed = false;
  if (order.paymentStatus === "pending") {
    await settleSessionById(sessionId);
    order = await getOrderForSession(user.id, sessionId);
    if (!order) return { status: "unknown" };
    changed = order.paymentStatus !== "pending";
  }

  if (order.paymentStatus === "paid" && order.paidAt) {
    const recent =
      Date.now() - order.paidAt.getTime() < CART_CLEAR_WINDOW_MINUTES * 60_000;
    const store = await cookies();
    if (recent && store.get(CART_COOKIE_CLEARED_ORDER)?.value !== order.publicId) {
      const lines = await readCart();
      await writeCart(
        removePurchased(
          lines,
          order.items.map((item) => ({
            slug: item.productSlug,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        ),
      );
      store.set(CART_COOKIE_CLEARED_ORDER, order.publicId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CART_CLEAR_WINDOW_MINUTES * 60,
      });
      changed = true;
    }
  }

  if (changed) refresh();
  return { status: order.paymentStatus };
}
