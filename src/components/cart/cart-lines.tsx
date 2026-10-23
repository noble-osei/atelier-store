"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { removeLine, setLineQuantity } from "@/app/cart/actions";
import { MAX_LINE_QUANTITY, type CartItem } from "@/lib/cart";
import { LOW_STOCK_THRESHOLD, ONE_SIZE, formatPrice } from "@/lib/products";
import { MinusIcon, PlusIcon } from "../icons";
import { StockStatus } from "../stock-status";

export function CartLines({ items }: { items: CartItem[] }) {
  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <CartLineRow key={item.key} item={item} />
      ))}
    </ul>
  );
}

function CartLineRow({ item }: { item: CartItem }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const unavailable = item.status === "unavailable";

  function run(action: () => ReturnType<typeof removeLine>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  const details = [
    item.size === ONE_SIZE ? null : `Size ${item.size}`,
    item.color,
  ].filter(Boolean);

  return (
    <li
      aria-busy={pending}
      className={`flex gap-4 border-b border-line py-6 md:gap-6 ${pending ? "opacity-60" : ""}`}
    >
      <Link
        href={`/products/${item.slug}`}
        className="media-product relative w-24 shrink-0 self-start md:w-32"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={item.image.src}
          alt=""
          fill
          sizes="(min-width: 48rem) 8rem, 6rem"
          className={unavailable ? "opacity-60" : ""}
        />
        {unavailable ? (
          <span className="badge absolute top-2 left-2 bg-canvas">Sold out</span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="type-eyebrow">{item.category}</span>
            <Link href={`/products/${item.slug}`} className="text-body-sm link-quiet">
              {item.name}
            </Link>
            {details.length > 0 ? (
              <span className="text-caption text-ink-muted">{details.join(" · ")}</span>
            ) : null}
          </div>
          {unavailable ? null : (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="type-price text-body-sm">
                {formatPrice((item.unitCents * item.quantity) / 100)}
              </span>
              {item.quantity > 1 ? (
                <span className="type-price text-caption text-ink-muted">
                  {formatPrice(item.unitCents / 100)} each
                </span>
              ) : null}
            </div>
          )}
        </div>

        {unavailable ? (
          <p role="status" className="text-caption text-danger">
            {item.size === ONE_SIZE ? "Sold out" : `Size ${item.size} is sold out`}. It is not
            included in your subtotal.
          </p>
        ) : (
          <>
            {item.status === "limited" ? (
              <p role="status" className="text-caption text-danger">
                Only {item.quantity} left, so we reduced the quantity from {item.requested}.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div
                role="group"
                aria-label={`Quantity for ${item.name}`}
                className="inline-flex items-center border border-line-strong"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={pending || item.quantity <= 1}
                  onClick={() => run(() => setLineQuantity(item.key, item.quantity - 1))}
                  className="inline-flex size-11 items-center justify-center disabled:text-ink-subtle"
                >
                  <MinusIcon />
                </button>
                <span className="min-w-8 text-center text-body-sm" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={pending || item.quantity >= item.max}
                  onClick={() => run(() => setLineQuantity(item.key, item.quantity + 1))}
                  className="inline-flex size-11 items-center justify-center disabled:text-ink-subtle"
                >
                  <PlusIcon />
                </button>
              </div>
              {item.max <= LOW_STOCK_THRESHOLD ? (
                <StockStatus state={{ status: "low_stock", quantity: item.max }} />
              ) : item.quantity >= item.max ? (
                <span className="text-caption text-ink-muted">
                  Maximum {MAX_LINE_QUANTITY} per order
                </span>
              ) : null}
            </div>
          </>
        )}

        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeLine(item.key))}
            className="btn btn-text"
          >
            Remove
            <span className="sr-only"> {item.name} from your bag</span>
          </button>
        </div>

        {error ? (
          <p role="alert" className="field-error">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}
