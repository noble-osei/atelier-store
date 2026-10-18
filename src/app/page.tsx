import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { StockStatus } from "@/components/stock-status";
import {
  campaign,
  categories,
  collections,
  hero,
  services,
  stories,
} from "@/lib/catalog";
import { getFeaturedProduct, getNewArrivals } from "@/lib/product-queries";
import { formatPrice, getProductStock } from "@/lib/products";

export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <FeaturedCollections />
      <NewArrivals />
      <Campaign />
      <ProductSpotlight />
      <ShopByCategory />
      <Journal />
      <Services />
    </>
  );
}

/* Campaign diptych: one portrait on phones, two side by side from tablet up */
function Hero() {
  return (
    <section aria-labelledby="hero-title" className="media-hero theme-inverse">
      <div className="absolute inset-0 grid md:grid-cols-2">
        {hero.images.map((image, i) => (
          <div key={image.src} className={`relative ${i > 0 ? "max-md:hidden" : ""}`}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 48rem) 50vw, 100vw"
              className="object-cover object-[50%_30%]"
            />
          </div>
        ))}
      </div>
      <div className="scrim-bottom absolute inset-0" aria-hidden />
      <div className="relative flex h-full flex-col items-center justify-end gap-5 px-gutter pb-14 text-center md:pb-20">
        <p className="type-eyebrow text-ink">{hero.eyebrow}</p>
        <h1 id="hero-title" className="type-editorial text-display-xl">
          {hero.title}
        </h1>
        <p className="max-w-md text-body-sm text-ink/85 max-sm:hidden">
          {hero.description}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <a href="#new-in" className="btn btn-primary">
            Shop the collection
          </a>
          <a href="#journal" className="btn btn-secondary">
            Discover
          </a>
        </div>
      </div>
    </section>
  );
}

function Statement() {
  return (
    <section className="section container-narrow text-center">
      <p className="type-eyebrow mb-6">The house of Atelier</p>
      <p className="mx-auto max-w-3xl type-editorial text-heading md:text-display md:leading-[1.1]">
        Made slowly, by hand, to be worn for a lifetime and{" "}
        <em>handed down after.</em>
      </p>
    </section>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 md:mb-12">
      <div>
        <p className="type-eyebrow mb-2">{eyebrow}</p>
        <h2 id={id} className="text-heading">
          {title}
        </h2>
      </div>
      {action ? (
        <a href="#" className="btn btn-text shrink-0">
          {action}
        </a>
      ) : null}
    </div>
  );
}

function FeaturedCollections() {
  return (
    <section
      id="collections"
      aria-labelledby="collections-title"
      className="container-site pb-section"
    >
      <h2 id="collections-title" className="sr-only">
        Featured collections
      </h2>
      <ul className="grid gap-x-grid gap-y-grid-y md:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.slug}>
            <a href="#" className="group block">
              <div className="relative aspect-portrait overflow-hidden bg-surface">
                <Image
                  src={collection.image.src}
                  alt={collection.image.alt}
                  fill
                  sizes="(min-width: 48rem) 33vw, 100vw"
                  className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-5 flex flex-col items-center gap-2 text-center">
                <p className="type-eyebrow">{collection.eyebrow}</p>
                <h3 className="text-heading-sm">{collection.title}</h3>
                <span className="btn btn-text mt-1">Shop now</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function NewArrivals() {
  const newArrivals = await getNewArrivals();

  return (
    <section
      id="new-in"
      aria-labelledby="new-in-title"
      className="section container-site border-t border-line"
    >
      <SectionHeading
        id="new-in-title"
        eyebrow="Autumn–Winter 2026"
        title="New in"
        action="View all"
      />
      <ul className="grid-products">
        {newArrivals.map((product) => (
          <li key={product.slug}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Full-bleed campaign band with copy set low on the left */
function Campaign() {
  return (
    <section aria-labelledby="campaign-title" className="media-hero theme-inverse">
      <Image
        src={campaign.image.src}
        alt={campaign.image.alt}
        fill
        sizes="100vw"
        className="object-cover object-[50%_20%]"
      />
      <div className="scrim-bottom absolute inset-0" aria-hidden />
      <div className="container-site relative flex h-full flex-col items-start justify-end gap-4 pb-14 md:pb-20">
        <p className="type-eyebrow text-ink">{campaign.eyebrow}</p>
        <h2 id="campaign-title" className="type-editorial text-display-xl">
          {campaign.title}
        </h2>
        <p className="max-w-sm text-body-sm text-ink/85">
          {campaign.description}
        </p>
        <a href="#" className="btn btn-secondary mt-2">
          Discover the edit
        </a>
      </div>
    </section>
  );
}

/* Single hero product: large image beside purchase details */
async function ProductSpotlight() {
  const product = await getFeaturedProduct();
  const [image] = product.images;
  const href = `/products/${product.slug}`;

  return (
    <section
      id="spotlight"
      aria-labelledby="spotlight-title"
      className="section container-site"
    >
      <div className="grid-editorial gap-y-10 md:items-center">
        <div className="col-span-4 md:col-span-7">
          <Link href={href} className="media-product block" tabIndex={-1}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 48rem) 58vw, 100vw"
            />
            {product.badge ? (
              <span className="badge absolute top-4 left-4 bg-canvas">
                {product.badge}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="col-span-4 md:col-span-5 lg:col-span-4 lg:col-start-9">
          <p className="type-eyebrow mb-4">Product focus</p>
          <h2
            id="spotlight-title"
            className="type-editorial text-display mb-3"
          >
            <Link href={href} className="link-quiet">
              {product.name}
            </Link>
          </h2>
          <p className="type-price mb-6 text-body-lg">
            {formatPrice(product.price)}
          </p>
          <p className="mb-8 text-body text-ink-muted">{product.description}</p>

          <div className="mb-8 flex items-center gap-3">
            <div className="flex gap-2" aria-hidden>
              {product.colors.map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className="size-4 rounded-full"
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            <span className="text-caption text-ink-muted">
              {product.colors.length} colors
            </span>
          </div>

          <StockStatus state={getProductStock(product)} className="mb-4" />
          <Link href={href} prefetch className="btn btn-primary btn-block mb-10">
            Shop now
          </Link>

          <ul className="border-t border-line text-body-sm">
            {product.details.map((detail) => (
              <li key={detail} className="border-b border-line py-3">
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ShopByCategory() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-title"
      className="section border-t border-line"
    >
      <div className="container-site">
        <SectionHeading
          id="categories-title"
          eyebrow="Accessories"
          title="Shop by category"
        />
      </div>
      <ul className="rail mx-auto max-w-site px-gutter">
        {categories.map((category) => (
          <li key={category.slug}>
            <a href="#" className="group block">
              <div className="media-product">
                <Image
                  src={category.image.src}
                  alt={category.image.alt}
                  fill
                  sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 45vw, 72vw"
                  className="transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-body">{category.title}</span>
                <ArrowRightIcon
                  width={16}
                  height={16}
                  className="transition-transform duration-300 ease-luxe group-hover:translate-x-1"
                />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Journal() {
  const [lead, ...rest] = stories;

  return (
    <section
      id="journal"
      aria-labelledby="journal-title"
      className="section container-site border-t border-line"
    >
      <SectionHeading
        id="journal-title"
        eyebrow="Atelier journal"
        title="Stories from the house"
        action="All stories"
      />
      <div className="grid gap-x-gutter gap-y-grid-y lg:grid-cols-12">
        <article className="lg:col-span-7">
          <a href="#" className="group block">
            <div className="relative aspect-portrait overflow-hidden bg-surface md:aspect-landscape lg:aspect-square">
              <Image
                src={lead.image.src}
                alt={lead.image.alt}
                fill
                sizes="(min-width: 64rem) 58vw, 100vw"
                className="object-cover object-top transition-transform duration-1000 ease-luxe group-hover:scale-[1.03]"
              />
            </div>
            <p className="type-eyebrow mt-5 mb-2">{lead.eyebrow}</p>
            <h3 className="type-editorial text-display mb-3">{lead.title}</h3>
            <p className="max-w-md text-body text-ink-muted">{lead.excerpt}</p>
          </a>
        </article>

        <div className="flex flex-col gap-y-grid-y md:flex-row md:gap-x-gutter lg:col-span-5 lg:flex-col">
          {rest.map((story) => (
            <article key={story.slug} className="flex-1">
              <a href="#" className="group block">
                <div className="relative aspect-landscape overflow-hidden bg-surface lg:aspect-video">
                  <Image
                    src={story.image.src}
                    alt={story.image.alt}
                    fill
                    sizes="(min-width: 64rem) 40vw, (min-width: 48rem) 50vw, 100vw"
                    className="object-cover object-[50%_25%] transition-transform duration-1000 ease-luxe group-hover:scale-[1.03]"
                  />
                </div>
                <p className="type-eyebrow mt-4 mb-2">{story.eyebrow}</p>
                <h3 className="text-heading-sm mb-2">{story.title}</h3>
                <p className="text-body-sm text-ink-muted">{story.excerpt}</p>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section aria-labelledby="services-title" className="border-t border-line bg-surface">
      <div className="section container-site">
        <h2 id="services-title" className="type-label mb-10 text-center">
          Atelier services
        </h2>
        <ul className="grid grid-cols-1 gap-y-8 text-center sm:grid-cols-2 sm:gap-x-gutter lg:grid-cols-4">
          {services.map((service) => (
            <li key={service.title}>
              <h3 className="text-body-lg mb-2">{service.title}</h3>
              <p className="mx-auto max-w-60 text-body-sm text-ink-muted">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
