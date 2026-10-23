// Checkout constants. Money and shipping come from here and the database,
// never from the browser. Types only: Client Components may import this file.

export const CURRENCY = "usd";

/** One flat shipping rate for every order, in cents. */
export const SHIPPING_CENTS = 1500;
export const SHIPPING_LABEL = "Standard shipping";

/** Countries Checkout collects a shipping address for (ISO 3166-1 alpha-2). */
export const SHIPPING_COUNTRIES = ["US", "CA", "GB", "FR", "DE", "IT", "ES"] as const;

/**
 * How long stock is held for an open checkout. Stripe's minimum session
 * lifetime is 30 minutes, so the extra two cover the time to create it.
 */
export const CHECKOUT_HOLD_MINUTES = 32;

/** Minutes after payment during which the success page may remove the bought lines from the cart. */
export const CART_CLEAR_WINDOW_MINUTES = 15;
