import "server-only";

import { asc, desc, eq, isNotNull, isNull, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { categories, products, productStock } from "@/db/schema";

// Admin reads. Deliberately not "use cache": admins must see the database as it
// is right now (the storefront getters can lag by hours), and these include
// products hidden from the storefront. No authorization happens in here: only
// call these from admin pages and Server Actions, after requireAdmin. The
// `pnpm check:admin` script blocks imports from anywhere else.

export type Availability = "all" | "available" | "hidden";

export const AVAILABILITY_FILTERS: readonly Availability[] = ["all", "available", "hidden"];

export function parseAvailability(value: unknown): Availability {
  return AVAILABILITY_FILTERS.find((filter) => filter === value) ?? "all";
}

const FILTERS: Record<Availability, SQL | undefined> = {
  all: undefined,
  available: isNull(products.archivedAt),
  hidden: isNotNull(products.archivedAt),
};

/** Every product, newest first, with its category and stock rows in size order. */
export async function listAdminProducts(availability: Availability) {
  const rows = await db.query.products.findMany({
    where: FILTERS[availability],
    columns: {
      id: true,
      slug: true,
      reference: true,
      name: true,
      priceCents: true,
      badge: true,
      images: true,
      archivedAt: true,
    },
    with: {
      category: { columns: { name: true } },
      stock: { orderBy: asc(productStock.position) },
    },
    orderBy: [desc(products.id)],
  });
  return rows.map(({ stock, ...row }) => ({
    ...row,
    sizes: stock.map((s) => ({ label: s.size, quantity: s.quantity, position: s.position })),
  }));
}

export type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>[number];

/** One product with all its editable fields and stock, or undefined. */
export async function getAdminProduct(id: number) {
  const row = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { stock: { orderBy: asc(productStock.position) } },
  });
  if (!row) return undefined;
  const { stock, ...product } = row;
  return {
    ...product,
    sizes: stock.map((s) => ({ label: s.size, quantity: s.quantity, position: s.position })),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export function listCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
}
