// Cart types and pure helpers shared by server and client code. Keep this file
// free of database and next/headers imports: Client Components import it.
// The cart is a cookie holding only what the customer chose. Prices and stock
// are always read from the database (./cart-queries.ts), never from the cookie.
import type { Image } from "./images";

export const CART_COOKIE = "atelier_cart";
export const CART_MAX_AGE = 60 * 60 * 24 * 30;

/** Remembers which paid order already emptied the bag, so revisiting the success page does not do it twice. */
export const CART_COOKIE_CLEARED_ORDER = "atelier_cart_cleared";

export const MAX_LINES = 20;
export const MAX_LINE_QUANTITY = 10;

/** What the cookie stores. `color` is null for products without colors. */
export type CartLine = {
  slug: string;
  size: string;
  color: string | null;
  quantity: number;
};

export function lineKey(line: Pick<CartLine, "slug" | "size" | "color">) {
  return JSON.stringify([line.slug, line.size, line.color]);
}

/** Stock is per product and size, so lines that differ only by color share it. */
export function stockKey(line: Pick<CartLine, "slug" | "size">) {
  return JSON.stringify([line.slug, line.size]);
}

export function isValidQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_LINE_QUANTITY
  );
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === "string" &&
    typeof line.size === "string" &&
    (line.color === null || typeof line.color === "string") &&
    isValidQuantity(line.quantity)
  );
}

/**
 * Reads the cookie value defensively: the customer can edit it, so bad JSON,
 * malformed lines and duplicates are dropped rather than trusted.
 */
export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const item of data) {
    if (!isCartLine(item)) continue;
    const line: CartLine = {
      slug: item.slug,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    };
    const key = lineKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length === MAX_LINES) break;
  }
  return lines;
}

export function serializeCart(lines: CartLine[]) {
  return JSON.stringify(lines);
}

/** Units in the bag, as chosen (not yet checked against stock). */
export function countUnits(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** Units of one product and size across every color line, except `exceptKey`. */
export function unitsInSize(
  lines: CartLine[],
  line: Pick<CartLine, "slug" | "size">,
  exceptKey?: string,
) {
  const target = stockKey(line);
  return lines.reduce(
    (total, other) =>
      stockKey(other) === target && lineKey(other) !== exceptKey
        ? total + other.quantity
        : total,
    0,
  );
}

/* Cart view --------------------------------------------------------------- */

/** Catalog facts the cart needs about one product, read fresh from the database. */
export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  category: string;
  reference: string;
  priceCents: number;
  image: Image;
  colors: string[];
  /** Units on hand per size label. */
  stock: Map<string, number>;
};

export type CartItemStatus = "ok" | "limited" | "unavailable";

export type CartItem = {
  key: string;
  productId: number;
  slug: string;
  name: string;
  category: string;
  reference: string;
  image: Image;
  size: string;
  color: string | null;
  unitCents: number;
  /** What the customer asked for. */
  requested: number;
  /** What can be bought now: never above stock. */
  quantity: number;
  /** Most the customer can have of this line right now. */
  max: number;
  status: CartItemStatus;
};

export type CartView = {
  items: CartItem[];
  subtotalCents: number;
  /** Units that count towards the subtotal. */
  units: number;
  hasIssues: boolean;
};

/**
 * Prices the lines against current catalog data. Quantities are capped by the
 * stock of the product and size, shared between color lines in cart order, so
 * the subtotal never includes units that cannot be bought. Lines for products
 * that no longer exist are dropped.
 */
export function buildCartView(
  lines: CartLine[],
  products: Map<string, CartProduct>,
): CartView {
  const remaining = new Map<string, number>();
  const items: CartItem[] = [];

  for (const line of lines) {
    const product = products.get(line.slug);
    if (!product) continue;

    const key = stockKey(line);
    const onHand = product.stock.get(line.size) ?? 0;
    const left = remaining.get(key) ?? onHand;
    const quantity = Math.min(line.quantity, MAX_LINE_QUANTITY, left);
    remaining.set(key, left - quantity);

    items.push({
      key: lineKey(line),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      reference: product.reference,
      image: product.image,
      size: line.size,
      color: line.color,
      unitCents: product.priceCents,
      requested: line.quantity,
      quantity,
      max: 0, // filled in below, once every line has taken its share
      status:
        quantity === 0 ? "unavailable" : quantity < line.quantity ? "limited" : "ok",
    });
  }

  // Most a line can hold: the size's stock minus what the other lines took.
  const taken = new Map<string, number>();
  for (const item of items) {
    const key = stockKey(item);
    taken.set(key, (taken.get(key) ?? 0) + item.quantity);
  }
  for (const item of items) {
    const onHand = products.get(item.slug)?.stock.get(item.size) ?? 0;
    const others = (taken.get(stockKey(item)) ?? 0) - item.quantity;
    item.max = Math.max(0, Math.min(MAX_LINE_QUANTITY, onHand - others));
  }

  return {
    items,
    subtotalCents: subtotalCents(items),
    units: items.reduce((total, item) => total + item.quantity, 0),
    hasIssues: items.some((item) => item.status !== "ok"),
  };
}

/**
 * The cart without the units that were just bought. Quantities are subtracted
 * line by line, so anything added after checkout began stays in the bag.
 */
export function removePurchased(
  lines: CartLine[],
  bought: Pick<CartLine, "slug" | "size" | "color" | "quantity">[],
): CartLine[] {
  const left = new Map(bought.map((item) => [lineKey(item), item.quantity]));
  return lines.flatMap((line) => {
    const taken = Math.min(line.quantity, left.get(lineKey(line)) ?? 0);
    return line.quantity - taken > 0 ? [{ ...line, quantity: line.quantity - taken }] : [];
  });
}

export function subtotalCents(
  items: Pick<CartItem, "unitCents" | "quantity">[],
) {
  return items.reduce((total, item) => total + item.unitCents * item.quantity, 0);
}
