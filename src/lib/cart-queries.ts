import "server-only";

import { asc, inArray } from "drizzle-orm";

import { db } from "@/db";
import { products, productStock } from "@/db/schema";
import { buildCartView, type CartLine, type CartProduct, type CartView } from "./cart";

// Deliberately not "use cache": the product getters in product-queries.ts can
// lag by hours, but a cart must price and stock-check against the database as
// it is right now.

/** Current price, colors and stock for the given product slugs. */
export async function getCartProducts(
  slugs: string[],
): Promise<Map<string, CartProduct>> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return new Map();

  const rows = await db.query.products.findMany({
    where: inArray(products.slug, unique),
    with: {
      category: true,
      stock: { orderBy: asc(productStock.position) },
    },
  });

  const result = new Map<string, CartProduct>();
  for (const row of rows) {
    const [image] = row.images;
    if (!image) continue;
    result.set(row.slug, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category.name,
      reference: row.reference,
      priceCents: row.priceCents,
      image,
      colors: row.colors.map((c) => c.name),
      // A hidden product has nothing to sell: the cart shows its lines as
      // unavailable and checkout refuses them. It stays in the result because
      // order pages still need its photo.
      stock: new Map(row.archivedAt ? [] : row.stock.map((s) => [s.size, s.quantity])),
    });
  }
  return result;
}

/** Units an open checkout is holding, which are off the shelf but still the customer's. */
export type HeldUnit = { slug: string; size: string; quantity: number };

/**
 * `held` adds the customer's own reserved units back to the stock they see, so
 * items held for their open checkout do not show as sold out in their own bag.
 */
export async function getCartView(
  lines: CartLine[],
  held: HeldUnit[] = [],
): Promise<CartView> {
  const catalog = await getCartProducts(lines.map((line) => line.slug));
  for (const unit of held) {
    const stock = catalog.get(unit.slug)?.stock;
    if (stock?.has(unit.size)) {
      stock.set(unit.size, (stock.get(unit.size) ?? 0) + unit.quantity);
    }
  }
  return buildCartView(lines, catalog);
}
