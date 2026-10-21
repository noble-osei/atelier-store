import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getLatestProducts } from "@/lib/product-queries";

export const metadata: Metadata = {
  title: "New arrivals",
  description:
    "The latest pieces from the Atelier Autumn–Winter 2026 collection: ready-to-wear, bags, shoes, jewelry and accessories.",
};

// Same content for every visitor, so the whole page stays prerendered.
export const ensureStatic = "prefetch";

export default async function NewArrivalsPage() {
  const products = await getLatestProducts();

  return (
    <div className="container-site">
      <nav aria-label="Breadcrumb" className="py-4 md:py-6">
        <ol className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">
            New arrivals
          </li>
        </ol>
      </nav>

      <header className="flex flex-col items-center gap-4 pt-6 pb-10 text-center md:pt-10 md:pb-16">
        <p className="type-eyebrow">Autumn–Winter 2026</p>
        <h1 className="type-editorial text-display">New arrivals</h1>
        <p className="max-w-md text-body text-ink-muted">
          The latest pieces from the atelier, newest first.
        </p>
      </header>

      {products.length > 0 ? (
        <section aria-labelledby="new-arrivals-title" className="pb-section">
          <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
            <h2 id="new-arrivals-title" className="sr-only">
              Products
            </h2>
            <p className="text-caption text-ink-muted">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <ul className="grid-products">
            {products.map((product, i) => (
              <li key={product.slug}>
                {/* First row is above the fold on every breakpoint */}
                <ProductCard product={product} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-6 pb-section text-center">
          <p className="text-body text-ink-muted">
            New pieces are on their way. Please check back soon.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to the store
          </Link>
        </section>
      )}
    </div>
  );
}
