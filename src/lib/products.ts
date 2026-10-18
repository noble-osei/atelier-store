// Product types and helpers shared by server and client code. Keep this file
// free of database imports: Client Components (purchase-panel) import it.
// Products are read from the database through ./product-queries.ts.
import type { Image } from "./images";

export type Color = { name: string; value: string };

// One-size products have a single "One size" entry.
export type Size = { label: string; stock: number };

export type Product = {
  slug: string;
  reference: string;
  name: string;
  category: string;
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

/* Price ------------------------------------------------------------------- */

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return priceFormatter.format(amount);
}
