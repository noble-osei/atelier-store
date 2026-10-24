"use server";

import { refresh } from "next/cache";

import { setStockQuantity } from "@/lib/admin-catalog";
import { revalidateProducts } from "@/lib/catalog-cache";
import { requireAdmin } from "@/lib/session";
import { parseStockForm } from "@/lib/stock-input";

// Admin stock Server Action. It is a directly reachable endpoint, so it calls
// requireAdmin first, before it reads any argument. Everything in the form is
// untrusted and re-validated by parseStockForm.

export type StockState = { error: string | null };

export async function submitStock(
  _previous: StockState,
  formData: FormData,
): Promise<StockState> {
  await requireAdmin("/admin/stock");

  const parsed = parseStockForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const result = await setStockQuantity(parsed.value);
  if (!result.ok) {
    // Show the admin the row as it is now, so saving again compares against it.
    refresh();
    return {
      error:
        result.reason === "missing"
          ? "This size no longer exists."
          : `Stock changed while you were editing: it is now ${result.current}. Check it and save again.`,
    };
  }

  // The storefront caches stock for hours; carts and checkout read it uncached.
  revalidateProducts();
  refresh();
  return { error: null };
}
