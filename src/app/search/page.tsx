import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/category-nav";
import { SearchIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import {
  getCategories,
  getLatestProducts,
  searchCatalog,
} from "@/lib/product-queries";
import { SEARCH_MAX_LENGTH, searchTerms } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Atelier collection by product, category or color.",
  robots: { index: false },
};

// Static shell; the query lives in the URL, so everything that reads it
// streams in behind Suspense.
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const { q } = await searchParams;
  const raw = (Array.isArray(q) ? q[0] : q) ?? "";
  const query = raw.trim().slice(0, SEARCH_MAX_LENGTH);
  const searched = searchTerms(query).length > 0;

  const [results, categories, latest] = await Promise.all([
    searched ? searchCatalog(query) : [],
    getCategories(),
    searched ? [] : getLatestProducts(8),
  ]);

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
            Search
          </li>
        </ol>
      </nav>

      <header className="flex flex-col items-center gap-6 pt-6 pb-8 text-center md:pt-10 md:pb-12">
        <h1 className="type-editorial text-display">Search</h1>
        <Form action="/search" role="search" className="flex w-full max-w-xl">
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            name="q"
            defaultValue={query}
            maxLength={SEARCH_MAX_LENGTH}
            placeholder="Search bags, coats, jewelry…"
            autoComplete="off"
            enterKeyHint="search"
            className="input min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            <SearchIcon width={16} height={16} />
            <span className="max-sm:sr-only">Search</span>
          </button>
        </Form>
      </header>

      {searched ? (
        <section aria-labelledby="results-title" className="pb-section">
          <div className="mb-6 border-b border-line pb-3">
            <h2 id="results-title" className="sr-only">
              Search results
            </h2>
            {/* Announced to screen readers when a new search streams in */}
            <p role="status" className="text-caption text-ink-muted">
              {results.length === 0
                ? `No results for “${query}”`
                : `${results.length} ${results.length === 1 ? "piece" : "pieces"} for “${query}”`}
            </p>
          </div>

          {results.length > 0 ? (
            <ul className="grid-products">
              {results.map((product, i) => (
                <li key={product.slug}>
                  <ProductCard product={product} priority={i < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-8 pt-6 text-center">
              <p className="max-w-md text-body text-ink-muted">
                We could not find a match. Check the spelling, try a broader
                term, or browse a category.
              </p>
              <CategoryNav categories={categories} label="Browse categories" />
              <Link href="/new-arrivals" className="btn btn-primary">
                Shop new arrivals
              </Link>
            </div>
          )}
        </section>
      ) : (
        <>
          <CategoryNav categories={categories} label="Browse categories" />
          <section aria-labelledby="latest-title" className="pb-section">
            <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
              <h2 id="latest-title" className="type-label">
                New arrivals
              </h2>
              <Link href="/new-arrivals" className="link-quiet text-caption">
                View all
              </Link>
            </div>
            <ul className="grid-products">
              {latest.map((product, i) => (
                <li key={product.slug}>
                  <ProductCard product={product} priority={i < 4} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

/* Mirrors the real layout so content does not jump when it streams in */
function SearchSkeleton() {
  return (
    <div className="container-site" aria-busy="true">
      <span className="sr-only">Loading search</span>
      <div className="py-4 md:py-6">
        <div className="h-4.5 w-24 bg-surface" />
      </div>
      <div className="flex flex-col items-center gap-6 pt-6 pb-8 md:pt-10 md:pb-12">
        <div className="h-12 w-48 bg-surface md:h-16" />
        <div className="h-control w-full max-w-xl bg-surface" />
      </div>
      <div className="mb-6 h-11" />
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
