"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { createProduct, setProductArchived, updateProduct } from "@/lib/admin-catalog";
import { getAdminProduct } from "@/lib/admin-queries";
import { revalidateProducts } from "@/lib/catalog-cache";
import {
  parseId,
  parseProductForm,
  type FieldErrors,
  type FormValues,
} from "@/lib/product-input";
import { ONE_SIZE } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

// Admin product Server Actions. Each one is a directly reachable endpoint, so
// each calls requireAdmin first, before it reads any argument. Arguments are
// untrusted: ids are re-parsed, the form is validated here, and prices, slugs
// and categories are only ever taken from the validated result.

export type ProductFormState = {
  error: string | null;
  fieldErrors: FieldErrors;
  /** What the admin typed, to refill the form after an error. */
  values: FormValues | null;
  saved: boolean;
};

const FORM_ERROR = "Check the highlighted fields and try again.";

const failed = (error: string, fieldErrors: FieldErrors = {}, values: FormValues | null = null) =>
  ({ error, fieldErrors, values, saved: false }) satisfies ProductFormState;

export async function submitNewProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products/new");

  const parsed = parseProductForm(formData, "create");
  if (!parsed.ok) return failed(FORM_ERROR, parsed.errors, parsed.values);

  const result = await createProduct(parsed.value);
  if (!result.ok) {
    return failed(
      result.message,
      result.field ? { [result.field]: result.message } : {},
      parsed.values,
    );
  }

  // Revalidate before redirect(): it throws, so nothing after it runs.
  revalidateProducts();
  redirect("/admin/products");
}

// `id` arrives through .bind() from the edit page, which is still the
// browser's word for it.
export async function submitProductEdit(
  id: unknown,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products");

  const productId = parseId(id);
  if (!productId) return failed("This product no longer exists.");

  const parsed = parseProductForm(formData, "edit");
  if (!parsed.ok) return failed(FORM_ERROR, parsed.errors, parsed.values);

  const existing = await getAdminProduct(productId);
  if (!existing) return failed("This product no longer exists.");

  // Sizes can be added here, not renamed or removed: checkouts and open orders
  // refer to the existing ones. Quantities are changed on the stock page.
  const taken = new Set(existing.sizes.map((s) => s.label.toLowerCase()));
  const sizeError =
    parsed.value.sizes.length === 0
      ? null
      : existing.sizes.some((s) => s.label === ONE_SIZE)
        ? `This is a "${ONE_SIZE}" product, so sizes cannot be added.`
        : parsed.value.sizes.find((s) => taken.has(s.label.toLowerCase()))
          ? "One of these sizes already exists."
          : null;
  if (sizeError) return failed(FORM_ERROR, { sizes: sizeError }, parsed.values);

  const nextPosition = existing.sizes.reduce((max, s) => Math.max(max, s.position), -1) + 1;
  const result = await updateProduct(productId, parsed.value, nextPosition);
  if (!result.ok) {
    return failed(
      result.message,
      result.field ? { [result.field]: result.message } : {},
      parsed.values,
    );
  }

  revalidateProducts();
  refresh();
  return { error: null, fieldErrors: {}, values: null, saved: true };
}

export type AvailabilityState = { error: string | null };

/** Hides a product from the storefront, or makes it available again. */
export async function submitAvailability(
  _previous: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  await requireAdmin("/admin/products");

  const id = parseId(formData.get("id"));
  const hide = formData.get("hide");
  if (!id || (hide !== "1" && hide !== "0")) {
    return { error: "This product no longer exists." };
  }

  const result = await setProductArchived(id, hide === "1");
  if (!result.ok) return { error: result.message };

  revalidateProducts();
  refresh();
  return { error: null };
}
