import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon } from "@/components/icons";
import { StockStatus, stockLabel } from "@/components/stock-status";
import {
  AVAILABILITY_FILTERS,
  listAdminProducts,
  parseAvailability,
  type Availability,
} from "@/lib/admin-queries";
import { formatCents } from "@/lib/product-input";
import { getStockState } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

const FILTER_LABELS: Record<Availability, string> = {
  all: "All",
  available: "Available",
  hidden: "Hidden",
};

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");

  const { availability: rawAvailability } = await searchParams;
  const availability = parseAvailability(rawAvailability);
  const products = await listAdminProducts(availability);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Products" description="View, create and edit products.">
        <div>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            New product
          </Link>
        </div>
      </AdminPageHeader>

      <nav aria-label="Availability filter">
        <ul className="flex gap-6">
          {AVAILABILITY_FILTERS.map((filter) => (
            <li key={filter}>
              <Link
                href={filter === "all" ? "/admin/products" : `/admin/products?availability=${filter}`}
                aria-current={filter === availability ? "page" : undefined}
                className="nav-link"
              >
                {FILTER_LABELS[filter]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {products.length === 0 ? (
        <p className="border-y border-line py-10 text-body text-ink-muted">
          {availability === "all" ? "There are no products yet." : "No products match this filter."}
        </p>
      ) : (
        <ul className="border-t border-line">
          {products.map((product) => {
            const [image] = product.images;
            const units = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
            const stock = getStockState(units);
            return (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-4 hover:bg-surface sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_9rem_1.25rem] sm:gap-x-6"
                >
                  <span className="relative block aspect-4/5 w-14 bg-surface">
                    {image ? (
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="56px"
                        className={`object-cover ${product.archivedAt ? "opacity-50" : ""}`}
                      />
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-body-sm">{product.name}</span>
                    <span className="truncate text-caption text-ink-muted">
                      {product.reference} · {product.category.name}
                    </span>
                    {product.archivedAt ? (
                      <span className="badge self-start text-ink-muted">Hidden</span>
                    ) : null}
                  </span>
                  <span className="type-price justify-self-end text-body-sm sm:order-3">
                    {formatCents(product.priceCents)}
                  </span>
                  <span className="col-start-2 col-span-2 sm:order-4 sm:col-auto sm:col-start-auto">
                    <StockStatus
                      state={stock}
                      label={stock.status === "in_stock" ? `${units} in stock` : stockLabel(stock)}
                    />
                  </span>
                  <ArrowRightIcon className="hidden size-5 justify-self-end sm:order-5 sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
