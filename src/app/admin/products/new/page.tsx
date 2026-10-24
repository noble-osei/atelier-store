import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listCategoryOptions } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/session";
import { submitNewProduct } from "../actions";

export const metadata: Metadata = { title: "New product" };

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminNewProductPage() {
  await requireAdmin("/admin/products/new");

  const categories = await listCategoryOptions();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/products" className="link-quiet self-start text-body-sm">
        All products
      </Link>
      <AdminPageHeader
        title="New product"
        description="The product is available in the store as soon as it is created."
      />
      {categories.length === 0 ? (
        <p className="border-y border-line py-10 text-body text-ink-muted">
          Add a category before creating products.
        </p>
      ) : (
        <ProductForm mode="create" categories={categories} action={submitNewProduct} />
      )}
    </div>
  );
}
