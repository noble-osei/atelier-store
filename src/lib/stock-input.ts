// Parsing and validation of the admin stock form. No database or server-only
// imports, like product-input.ts: the Server Action uses parseStockForm as the
// authority and the form (a Client Component) only reuses the limits. FormData is
// untrusted, so nothing here assumes a field is present or a string.
import { LIMITS, parseId } from "./product-input";
import { getStockState } from "./products";

export type StockInput = {
  productId: number;
  /** Matched exactly against the stored size: it is part of the primary key. */
  size: string;
  /** The quantity the admin was looking at; the write only applies if it still holds. */
  expected: number;
  quantity: number;
};

export type StockParseResult = { ok: true; value: StockInput } | { ok: false; error: string };

const INT_MAX = 2_147_483_647;

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export function parseStockForm(data: FormData): StockParseResult {
  const productId = parseId(data.get("productId"));
  if (!productId) return { ok: false, error: "This product no longer exists." };

  const size = text(data, "size");
  if (!size || size.length > LIMITS.sizeLabel) {
    return { ok: false, error: "This size no longer exists." };
  }

  const expectedRaw = text(data, "expected");
  if (!/^\d{1,10}$/.test(expectedRaw) || Number(expectedRaw) > INT_MAX) {
    return { ok: false, error: "Reload the page and try again." };
  }

  const quantityRaw = text(data, "quantity").trim();
  if (!/^\d{1,6}$/.test(quantityRaw) || Number(quantityRaw) > LIMITS.quantity) {
    return { ok: false, error: `Enter a whole number from 0 to ${LIMITS.quantity}.` };
  }

  const expected = Number(expectedRaw);
  const quantity = Number(quantityRaw);
  if (quantity === expected) return { ok: false, error: "Quantity is unchanged." };

  return { ok: true, value: { productId, size, expected, quantity } };
}

/* Filter ----------------------------------------------------------------- */

export type StockFilter = "all" | "low" | "out";

export const STOCK_FILTERS: readonly StockFilter[] = ["all", "low", "out"];

export function parseStockFilter(value: unknown): StockFilter {
  return STOCK_FILTERS.find((filter) => filter === value) ?? "all";
}

/** Whether a size's quantity belongs under the filter ("low" includes sold out). */
export function matchesStockFilter(quantity: number, filter: StockFilter) {
  const { status } = getStockState(quantity);
  if (filter === "out") return status === "out_of_stock";
  if (filter === "low") return status !== "in_stock";
  return true;
}
