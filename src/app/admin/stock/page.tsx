import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { StockRowForm } from "@/components/admin/stock-row-form";
import { StockStatus, stockLabel } from "@/components/stock-status";
import { listAdminProducts } from "@/lib/admin-queries";
import { getStockState } from "@/lib/products";
import { requireAdmin } from "@/lib/session";
import { matchesStockFilter, parseStockFilter, STOCK_FILTERS, type StockFilter } from "@/lib/stock-input";

export const metadata: Metadata = { title: "Stock" };

const FILTER_LABELS: Record<StockFilter, string> = {
  all: "All",
  low: "Low or sold out",
  out: "Sold out",
};

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminStockPage({ searchParams }: PageProps<"/admin/stock">) {
  await requireAdmin("/admin/stock");

  const { stock: rawFilter } = await searchParams;
  const filter = parseStockFilter(rawFilter);
  const products = (await listAdminProducts("all")).filter((product) =>
    product.sizes.some((size) => matchesStockFilter(size.quantity, filter)),
  );

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Stock"
        description="Quantity is what can be sold right now. Units held by open checkouts are already subtracted, and they come back by themselves if the checkout expires or fails."
      />

      <nav aria-label="Stock filter">
        <ul className="flex gap-6">
          {STOCK_FILTERS.map((option) => (
            <li key={option}>
              <Link
                href={option === "all" ? "/admin/stock" : `/admin/stock?stock=${option}`}
                aria-current={option === filter ? "page" : undefined}
                className="nav-link"
              >
                {FILTER_LABELS[option]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {products.length === 0 ? (
        <p className="border-y border-line py-10 text-body text-ink-muted">
          {filter === "all" ? "There are no products yet." : "No products match this filter."}
        </p>
      ) : (
        <ul className="border-t border-line">
          {products.map((product) => {
            const units = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
            const total = getStockState(units);
            return (
              <li key={product.id} className="flex flex-col gap-4 border-b border-line py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="link truncate text-body-sm"
                    >
                      {product.name}
                    </Link>
                    <span className="truncate text-caption text-ink-muted">
                      {product.reference} · {product.category.name}
                    </span>
                    {product.archivedAt ? (
                      <span className="badge self-start text-ink-muted">Hidden</span>
                    ) : null}
                  </div>
                  <StockStatus
                    state={total}
                    label={total.status === "in_stock" ? `${units} in stock` : stockLabel(total)}
                  />
                </div>

                <ul className="flex flex-col divide-y divide-line">
                  {product.sizes
                    .filter((size) => matchesStockFilter(size.quantity, filter))
                    .map((size) => (
                      <li
                        key={size.label}
                        className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-body-sm">{size.label}</span>
                          <StockStatus state={getStockState(size.quantity)} />
                        </div>
                        <StockRowForm
                          productId={product.id}
                          productName={product.name}
                          size={size.label}
                          quantity={size.quantity}
                        />
                      </li>
                    ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
