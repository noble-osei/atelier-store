import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/category-nav";
import { ProductCard } from "@/components/product-card";
import {
  getCategories,
  getCategoryWithProducts,
} from "@/lib/product-queries";

// Same content for every visitor, so prefetches stay static.
export const ensureStatic = "prefetch";

// Every category in the database is prerendered; unknown slugs 404.
export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryWithProducts(slug);
  if (!result) return {};

  const { category } = result;
  return {
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} from the Atelier Autumn–Winter 2026 collection.`,
  };
}

// Static shell; everything that depends on the slug streams in behind
// Suspense, like the product page.
export default function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryCollection params={params} />
    </Suspense>
  );
}

async function CategoryCollection({
  params,
}: {
  params: PageProps<"/categories/[slug]">["params"];
}) {
  const { slug } = await params;
  const [result, allCategories] = await Promise.all([
    getCategoryWithProducts(slug),
    getCategories(),
  ]);
  if (!result) notFound();

  const { category, products } = result;

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
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="flex flex-col items-center gap-4 pt-6 pb-8 text-center md:pt-10 md:pb-12">
        <p className="type-eyebrow">The collection</p>
        <h1 className="type-editorial text-display">{category.name}</h1>
      </header>

      <CategoryNav categories={allCategories} current={category.slug} />

      {products.length > 0 ? (
        <section aria-labelledby="collection-title" className="pb-section">
          <div className="mb-6 border-b border-line pb-3">
            <h2 id="collection-title" className="sr-only">
              {category.name} products
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
          <Link href="/new-arrivals" className="btn btn-primary">
            Shop new arrivals
          </Link>
        </section>
      )}
    </div>
  );
}

/* Mirrors the real layout so content does not jump when it streams in */
function CategorySkeleton() {
  return (
    <div className="container-site" aria-busy="true">
      <span className="sr-only">Loading collection</span>
      <div className="py-4 md:py-6">
        <div className="h-4.5 w-32 bg-surface" />
      </div>
      <div className="flex flex-col items-center gap-4 pt-6 pb-8 md:pt-10 md:pb-12">
        <div className="h-3 w-24 bg-surface" />
        <div className="h-16 w-64 bg-surface" />
      </div>
      <div className="mb-6 h-11" />
      <div className="mb-6 border-b border-line pb-3">
        <div className="h-4.5 w-16 bg-surface" />
      </div>
      <ul className="grid-products pb-section">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i}>
            <div className="media-product" />
            <div className="mt-3 flex flex-col gap-1">
              <div className="h-4 w-20 bg-surface" />
              <div className="h-5 w-3/4 bg-surface" />
              <div className="h-4.5 w-12 bg-surface" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
