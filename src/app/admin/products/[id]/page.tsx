import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityControl } from "@/components/admin/availability-control";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, listCategoryOptions } from "@/lib/admin-queries";
import { parseId } from "@/lib/product-input";
import { requireAdmin } from "@/lib/session";
import { submitProductEdit } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminEditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  // The role check comes before anything about the URL is looked at, so a
  // non-admin learns nothing from which ids exist or are well formed.
  const { id: rawId } = await params;
  await requireAdmin(`/admin/products/${encodeURIComponent(rawId)}`);

  const id = parseId(rawId);
  if (!id) notFound();
  const [product, categories] = await Promise.all([getAdminProduct(id), listCategoryOptions()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/products" className="link-quiet self-start text-body-sm">
        All products
      </Link>
      <AdminPageHeader title={product.name}>
        <p className="text-caption text-ink-muted">
          {product.archivedAt ? (
            "Hidden from the store"
          ) : (
            <Link href={`/products/${product.slug}`} className="link">
              View in the store
            </Link>
          )}
        </p>
      </AdminPageHeader>

      <AvailabilityControl productId={product.id} hidden={product.archivedAt !== null} />

      {/* Keyed by the last update so the fields pick up the saved values. */}
      <ProductForm
        key={product.updatedAt.getTime()}
        mode="edit"
        categories={categories}
        action={submitProductEdit.bind(null, product.id)}
        product={product}
      />
    </div>
  );
}
