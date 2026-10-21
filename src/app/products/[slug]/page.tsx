import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import {
  getProduct,
  getProducts,
  getRelatedProducts,
} from "@/lib/product-queries";
import {
  formatPrice,
  getProductStock,
  isOneSize,
  type Product,
} from "@/lib/products";

// Product content is the same for every visitor, so prefetches of product
// links must stay static (no cookies or headers in this route).
export const ensureStatic = "prefetch";

// Every product in the database is prerendered; unknown slugs 404.
export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: `${product.images[0].src}?w=1200&q=80`, alt: product.images[0].alt }],
    },
  };
}

// The page itself is a static shell. Everything that depends on the slug
// sits behind Suspense, so a client navigation can show the skeleton at once
// instead of blocking. Product links prefetch, so the real content is usually
// ready before the click.
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({
  params,
}: {
  params: PageProps<"/products/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const stock = getProductStock(product);

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="container-site">
        <nav aria-label="Breadcrumb" className="py-4 md:py-6">
          <ol className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/categories/${product.categorySlug}`}
                className="link-quiet"
              >
                {product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid-editorial gap-y-8 pb-section">
          <div className="col-span-4 max-md:full-bleed md:col-span-7">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div className="col-span-4 md:col-span-5 md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start lg:col-span-4 lg:col-start-9">
            <p className="type-eyebrow mb-3">{product.category}</p>
            <h1 className="type-editorial text-display mb-3">{product.name}</h1>
            <p className="type-price mb-1 text-body-lg">
              {formatPrice(product.price)}
            </p>
            <p className="mb-6 text-caption text-ink-muted">
              Ref. {product.reference}
              {product.badge ? <> · {product.badge}</> : null}
            </p>
            <p className="mb-8 text-body text-ink-muted">
              {product.description}
            </p>

            <PurchasePanel
              productName={product.name}
              colors={product.colors}
              sizes={product.sizes}
              oneSize={isOneSize(product)}
              stock={stock}
            />

            <ul className="mt-6 flex flex-col gap-1 text-caption text-ink-muted">
              <li>Complimentary express shipping and returns</li>
              <li>Every order arrives in our signature packaging</li>
            </ul>

            <div className="mt-8 border-t border-line">
              <Disclosure title="Details" open>
                <ul className="flex flex-col gap-1.5">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </Disclosure>
              <Disclosure title="Shipping and returns">
                <p>
                  Complimentary express delivery in 1–3 business days. Returns
                  and exchanges are free within 30 days and can be collected
                  from your door.
                </p>
              </Disclosure>
              <Disclosure title="Care and repairs">
                <p>
                  Store in the dust bag provided, away from direct sunlight.
                  Our atelier offers complimentary repairs for the first two
                  years.
                </p>
              </Disclosure>
              <Disclosure title="Book an appointment">
                <p>
                  See this piece in person at your nearest store, or book a
                  private video consultation with a client advisor.
                </p>
              </Disclosure>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
    </>
  );
}

/* Mirrors the real layout so content does not jump when it streams in */
function ProductSkeleton() {
  return (
    <div className="container-site" aria-busy="true">
      <span className="sr-only">Loading product</span>
      <div className="py-4 md:py-6">
        <div className="h-4.5 w-48 bg-surface" />
      </div>
      <div className="grid-editorial gap-y-8 pb-section">
        <div className="col-span-4 max-md:full-bleed md:col-span-7">
          <div className="media-product" />
        </div>
        <div className="col-span-4 flex flex-col gap-4 md:col-span-5 lg:col-span-4 lg:col-start-9">
          <div className="h-3 w-24 bg-surface" />
          <div className="h-16 w-4/5 bg-surface" />
          <div className="h-5 w-20 bg-surface" />
          <div className="mt-4 h-20 w-full bg-surface" />
          <div className="mt-4 h-control w-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

/* Exclusive accordion: opening one section closes the others */
function Disclosure({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details name="product-info" open={open} className="group border-b border-line">
      <summary className="type-label flex min-h-14 list-none items-center justify-between [&::-webkit-details-marker]:hidden">
        {title}
        <PlusIcon
          width={16}
          height={16}
          className="transition-transform duration-300 ease-luxe group-open:rotate-45"
        />
      </summary>
      <div className="pb-6 text-body-sm text-ink-muted">{children}</div>
    </details>
  );
}

async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product);

  return (
    <section
      aria-labelledby="related-title"
      className="section border-t border-line"
    >
      <div className="container-site mb-8 md:mb-12">
        <p className="type-eyebrow mb-2">{product.category}</p>
        <h2 id="related-title" className="text-heading">
          You may also like
        </h2>
      </div>
      <ul className="rail mx-auto max-w-site px-gutter">
        {related.map((item) => (
          <li key={item.slug}>
            <ProductCard
              product={item}
              sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 45vw, 72vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Structured data so search engines show price and availability */
function ProductJsonLd({ product }: { product: Product }) {
  const availability = {
    in_stock: "https://schema.org/InStock",
    low_stock: "https://schema.org/LimitedAvailability",
    out_of_stock: "https://schema.org/OutOfStock",
  }[getProductStock(product).status];

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.reference,
    category: product.category,
    description: product.description,
    image: product.images.map((image) => image.src),
    brand: { "@type": "Brand", name: "Atelier" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
