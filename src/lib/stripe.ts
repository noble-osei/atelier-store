import "server-only";

import Stripe from "stripe";

let client: Stripe | undefined;

// Created on first use rather than at import, so the store still builds and
// browses without Stripe keys; only checkout needs them. The API version is the
// one pinned by the installed SDK.
export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

/** Origin used for Checkout return URLs. Reuses the auth base URL. */
export function getSiteOrigin() {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) throw new Error("BETTER_AUTH_URL is not set");
  return new URL(url).origin;
}
