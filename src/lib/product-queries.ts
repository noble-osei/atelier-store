import "server-only";

import { asc, eq, inArray, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { products, productStock } from "@/db/schema";
import type { Product } from "./products";

// Merchandising picks stay in code, like the rest of the editorial content.
const NEW_ARRIVAL_SLUGS = [
  "biker-jacket",
  "pearl-necklace",
  "woven-chain-bag",
  "round-sunglasses",
  "floral-pump",
  "pleated-trousers",
  "leather-strap-watch",
  "suede-bomber",
];

const FEATURED_SLUG = "atelier-top-handle";

// Product data is the same for every visitor, so reads are cached and pages
// stay prerendered. Stock can lag by up to the cache life; call
// revalidateTag("products") after writes once anything changes stock.
function cacheProducts() {
  cacheTag("products");
  cacheLife("hours");
}

// Every read loads the category and stock rows (in size order) with the product.
function findProducts(where?: SQL) {
  return db.query.products.findMany({
    where,
    with: {
      category: true,
      stock: { orderBy: asc(productStock.position) },
    },
    orderBy: asc(products.id),
  });
}

type ProductRow = Awaited<ReturnType<typeof findProducts>>[number];

function toProduct(row: ProductRow): Product {
  const [first, ...rest] = row.images;
  if (!first) throw new Error(`Product "${row.slug}" has no images`);

  return {
    slug: row.slug,
    reference: row.reference,
    name: row.name,
    category: row.category.name,
    price: row.priceCents / 100,
    badge: row.badge ?? undefined,
    images: [first, ...rest],
    description: row.description,
    details: row.details,
    colors: row.colors,
    sizes: row.stock.map((s) => ({ label: s.size, stock: s.quantity })),
  };
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheProducts();

  const rows = await findProducts();
  return rows.map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheProducts();

  const [row] = await findProducts(eq(products.slug, slug));
  return row ? toProduct(row) : undefined;
}

export async function getNewArrivals(): Promise<Product[]> {
  "use cache";
  cacheProducts();

  const rows = await findProducts(inArray(products.slug, NEW_ARRIVAL_SLUGS));
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return NEW_ARRIVAL_SLUGS.flatMap((slug) => bySlug.get(slug) ?? []);
}

export async function getFeaturedProduct(): Promise<Product> {
  const product = await getProduct(FEATURED_SLUG);
  if (!product) throw new Error("Featured product is missing from the catalog");
  return product;
}

/** Same category first, then the rest of the catalog, never the product itself. */
export async function getRelatedProducts(
  product: Product,
  limit = 8,
): Promise<Product[]> {
  const others = (await getProducts()).filter((p) => p.slug !== product.slug);
  return [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, limit);
}
