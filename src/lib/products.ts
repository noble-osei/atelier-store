// Product types and helpers shared by server and client code. Keep this file
// free of database imports: Client Components (purchase-panel) import it.
// Products are read from the database through ./product-queries.ts.
import type { Image } from "./images";

export type Color = { name: string; value: string };

export type Category = { slug: string; name: string };

// One-size products have a single "One size" entry.
export type Size = { label: string; stock: number };

export type Product = {
  slug: string;
  reference: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  badge?: "New" | "Limited" | "Exclusive";
  /** First image is the primary shot used in grids. */
  images: [Image, ...Image[]];
  description: string;
  details: string[];
  colors: Color[];
  sizes: Size[];
};

export const ONE_SIZE = "One size";

/* Stock ------------------------------------------------------------------- */

export const LOW_STOCK_THRESHOLD = 3;

export type StockState =
  | { status: "in_stock" }
  | { status: "low_stock"; quantity: number }
  | { status: "out_of_stock" };

export function getStockState(quantity: number): StockState {
  if (quantity <= 0) return { status: "out_of_stock" };
  if (quantity <= LOW_STOCK_THRESHOLD) return { status: "low_stock", quantity };
  return { status: "in_stock" };
}

export function getProductStock(product: Product): StockState {
  return getStockState(
    product.sizes.reduce((total, size) => total + size.stock, 0),
  );
}

export function isOneSize(product: Product) {
  return product.sizes.length === 1 && product.sizes[0].label === ONE_SIZE;
}

/* Search ------------------------------------------------------------------ */

export const SEARCH_MAX_LENGTH = 100;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Lowercased, accent-free words of a query; empty when it has none. */
export function searchTerms(query: string) {
  return normalize(query.slice(0, SEARCH_MAX_LENGTH)).split(/\s+/).filter(Boolean);
}

/**
 * Products matching every term, best first. A term can match the name, category,
 * reference, colors, badge or the copy; name hits rank highest. Ties keep catalog
 * order.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const ranked: { product: Product; score: number }[] = [];
  for (const product of products) {
    const fields = [
      { text: normalize(product.name), weight: 4 },
      { text: normalize(product.category), weight: 3 },
      {
        text: normalize(
          [product.reference, product.badge, ...product.colors.map((c) => c.name)]
            .filter(Boolean)
            .join(" "),
        ),
        weight: 2,
      },
      {
        text: normalize([product.description, ...product.details].join(" ")),
        weight: 1,
      },
    ];

    let score = 0;
    for (const term of terms) {
      const best = Math.max(
        0,
        ...fields.filter((f) => f.text.includes(term)).map((f) => f.weight),
      );
      if (best === 0) {
        score = 0;
        break;
      }
      score += best;
    }
    if (score > 0) ranked.push({ product, score });
  }

  // Array.prototype.sort is stable, so equal scores keep catalog order.
  return ranked.sort((a, b) => b.score - a.score).map((r) => r.product);
}

/* Price ------------------------------------------------------------------- */

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return priceFormatter.format(amount);
}
