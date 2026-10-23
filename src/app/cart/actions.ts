"use server";

import { refresh } from "next/cache";

import {
  MAX_LINES,
  MAX_LINE_QUANTITY,
  isValidQuantity,
  lineKey,
  unitsInSize,
  type CartLine,
} from "@/lib/cart";
import { readCart, writeCart } from "@/lib/cart-cookie";
import { getCartProducts } from "@/lib/cart-queries";

// Cart mutations. Arguments come from the browser, so they are treated as
// untrusted: only the choice (product, size, color, quantity) is read from
// them. Price and stock always come from the database, and the cart is
// guest-capable, so nothing here needs a session.

export type CartActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): CartActionResult => ({ ok: false, error });

function availabilityError(size: string, available: number, oneSize: boolean) {
  if (available <= 0) return oneSize ? "Sold out." : `Size ${size} is sold out.`;
  const left = `Only ${available} available`;
  return oneSize ? `${left}.` : `${left} in size ${size}.`;
}

type AddInput = { slug: unknown; size: unknown; color: unknown; quantity: unknown };

export async function addToCart(input: AddInput): Promise<CartActionResult> {
  const { slug, size, color, quantity } = (input ?? {}) as Partial<AddInput>;
  if (typeof slug !== "string" || typeof size !== "string") return fail("Choose a size.");
  if (color !== null && typeof color !== "string") return fail("Choose a color.");
  if (!isValidQuantity(quantity)) return fail("Choose a quantity.");

  const product = (await getCartProducts([slug])).get(slug);
  if (!product) return fail("This product is no longer available.");

  const available = product.stock.get(size);
  if (available === undefined) return fail("Choose a size.");
  if (product.colors.length > 0 ? !product.colors.includes(color ?? "") : color !== null) {
    return fail("Choose a color.");
  }

  const oneSize = product.stock.size === 1;
  const lines = await readCart();
  const line: CartLine = { slug, size, color, quantity };
  const key = lineKey(line);
  const existing = lines.find((l) => lineKey(l) === key);

  if (!existing && lines.length >= MAX_LINES) {
    return fail(`Your bag is full (${MAX_LINES} items). Remove one to add another.`);
  }
  if ((existing?.quantity ?? 0) + quantity > MAX_LINE_QUANTITY) {
    return fail(`You can order up to ${MAX_LINE_QUANTITY} of one item.`);
  }
  // Stock is shared by every color line of this size.
  if (unitsInSize(lines, line) + quantity > available) {
    return fail(availabilityError(size, available, oneSize));
  }

  await writeCart(
    existing
      ? lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity } : l))
      : [...lines, line],
  );
  refresh();
  return { ok: true };
}

export async function setLineQuantity(
  key: unknown,
  quantity: unknown,
): Promise<CartActionResult> {
  if (typeof key !== "string" || !isValidQuantity(quantity)) {
    return fail("Choose a quantity.");
  }

  const lines = await readCart();
  const line = lines.find((l) => lineKey(l) === key);
  if (!line) return fail("This item is no longer in your bag.");

  const product = (await getCartProducts([line.slug])).get(line.slug);
  if (!product) return fail("This product is no longer available.");

  const available = product.stock.get(line.size) ?? 0;
  if (unitsInSize(lines, line, key) + quantity > available) {
    return fail(availabilityError(line.size, available, product.stock.size === 1));
  }

  await writeCart(lines.map((l) => (l === line ? { ...l, quantity } : l)));
  refresh();
  return { ok: true };
}

export async function removeLine(key: unknown): Promise<CartActionResult> {
  if (typeof key !== "string") return fail("This item is no longer in your bag.");

  const lines = await readCart();
  await writeCart(lines.filter((l) => lineKey(l) !== key));
  refresh();
  return { ok: true };
}
