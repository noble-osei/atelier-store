import "server-only";

import { and, asc, desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, products, productStock } from "@/db/schema";
import { searchProducts, type Category, type Product } from "./products";

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

// The home page needs this product, so admins cannot hide it.
export const FEATURED_SLUG = "atelier-top-handle";

// Product data is the same for every visitor, so reads are cached and pages
// stay prerendered. Stock can lag by up to the cache life; call
// revalidateTag("products") after writes once anything changes stock.
function cacheProducts() {
  cacheTag("products");
  cacheLife("hours");
}

// Every read loads the category and stock rows (in size order) with the product,
// and skips products an admin has hidden from the storefront.
function findProducts(
  where?: SQL,
  { orderBy = [asc(products.id)], limit }: { orderBy?: SQL[]; limit?: number } = {},
) {
  return db.query.products.findMany({
    where: and(isNull(products.archivedAt), where),
    with: {
      category: true,
      stock: { orderBy: asc(productStock.position) },
    },
    orderBy,
    limit,
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
    categorySlug: row.category.slug,
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

/** Newest products first. Rows inserted together (the seed) fall back to id. */
export async function getLatestProducts(limit = 24): Promise<Product[]> {
  "use cache";
  cacheProducts();

  const rows = await findProducts(undefined, {
    orderBy: [desc(products.createdAt), desc(products.id)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheProducts();

  return db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.id));
}

/** The category and its products, or undefined when the slug is unknown. */
export async function getCategoryWithProducts(
  slug: string,
): Promise<{ category: Category; products: Product[] } | undefined> {
  "use cache";
  cacheProducts();

  const [category] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, slug));
  if (!category) return undefined;

  const rows = await findProducts(eq(products.categoryId, category.id));
  return {
    category: { slug: category.slug, name: category.name },
    products: rows.map(toProduct),
  };
}

/**
 * Matches against the cached catalog, so a query never hits the database and
 * the catalog is small enough to filter in memory.
 */
export async function searchCatalog(query: string): Promise<Product[]> {
  return searchProducts(await getProducts(), query);
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
