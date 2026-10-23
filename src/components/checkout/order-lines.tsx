import Image from "next/image";
import Link from "next/link";

import type { Image as ProductImage } from "@/lib/images";
import { ONE_SIZE, formatPrice } from "@/lib/products";
import type { OrderView } from "./order-confirmation";

// The purchased lines of an order, shared by the confirmation page and the
// account's order detail. Names and prices are the ones stored on the order.
export function OrderLines({
  items,
  images,
}: {
  items: OrderView["items"];
  /** Catalog photography by product slug; a missing one shows a plain frame. */
  images: Record<string, ProductImage>;
}) {
  return (
    <ul className="border-t border-line">
      {items.map((item) => {
        const image = images[item.productSlug];
        return (
          <li key={item.id} className="flex gap-4 border-b border-line py-5 md:gap-6">
            <Link
              href={`/products/${item.productSlug}`}
              tabIndex={-1}
              aria-hidden
              className="media-product relative w-20 shrink-0 self-start md:w-24"
            >
              {image ? (
                <Image src={image.src} alt="" fill sizes="(min-width: 48rem) 6rem, 5rem" />
              ) : null}
            </Link>
            <div className="flex min-w-0 flex-1 justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`/products/${item.productSlug}`} className="text-body-sm link-quiet">
                  {item.name}
                </Link>
                <span className="text-caption text-ink-muted">
                  {[item.size === ONE_SIZE ? null : `Size ${item.size}`, item.color]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="text-caption text-ink-muted">Qty {item.quantity}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="type-price text-body-sm">
                  {formatPrice((item.unitPriceCents * item.quantity) / 100)}
                </span>
                {item.quantity > 1 ? (
                  <span className="type-price text-caption text-ink-muted">
                    {formatPrice(item.unitPriceCents / 100)} each
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
