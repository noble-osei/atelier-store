import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  getProductStock,
  type Product,
} from "@/lib/products";
import { StockStatus } from "./stock-status";

type ProductCardProps = {
  product: Product;
  sizes?: string;
  priority?: boolean;
};

export function ProductCard({
  product,
  sizes = "(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw",
  priority = false,
}: ProductCardProps) {
  const [image] = product.images;
  const stock = getProductStock(product);
  const soldOut = stock.status === "out_of_stock";
  const badge = soldOut ? "Sold out" : product.badge;

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch // product pages are static, so prefetching them is cheap
      className="group block"
    >
      <div className="media-product">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`transition-transform duration-700 ease-luxe group-hover:scale-[1.03] ${soldOut ? "opacity-60" : ""}`}
        />
        {badge ? (
          <span className="badge absolute top-3 left-3 bg-canvas">{badge}</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <span className="type-eyebrow">{product.category}</span>
        <span className="text-body-sm group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </span>
        <span className="type-price text-caption text-ink-muted">
          {formatPrice(product.price)}
        </span>
        {/* Sold out already has its badge; in stock needs no note. */}
        {stock.status === "low_stock" ? <StockStatus state={stock} /> : null}
      </div>
    </Link>
  );
}
