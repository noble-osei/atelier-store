"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import {
  getStockState,
  type Color,
  type Size,
  type StockState,
} from "@/lib/products";
import { HeartIcon } from "./icons";
import { StockStatus, stockLabel } from "./stock-status";

type PurchasePanelProps = {
  productName: string;
  colors: Color[];
  sizes: Size[];
  oneSize: boolean;
  stock: StockState;
};

// Color and size selection, stock for the chosen size, and the bag action.
// The bag is not wired to a cart yet: adding only confirms the selection.
export function PurchasePanel({
  productName,
  colors,
  sizes,
  oneSize,
  stock,
}: PurchasePanelProps) {
  const id = useId();
  const firstSizeRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(colors[0]?.name);
  const [size, setSize] = useState<string | null>(oneSize ? sizes[0].label : null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  const soldOut = stock.status === "out_of_stock";
  const selected = sizes.find((s) => s.label === size);
  const shownStock =
    selected && !oneSize ? getStockState(selected.stock) : stock;
  const shownLabel =
    selected && !oneSize && shownStock.status !== "out_of_stock"
      ? `${stockLabel(shownStock)} in size ${selected.label}`
      : stockLabel(shownStock);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size) {
      setError(true);
      firstSizeRef.current?.focus();
      return;
    }
    setAdded(true);
  }

  const firstAvailable = sizes.findIndex((s) => s.stock > 0);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {colors.length > 0 ? (
        <fieldset>
          <legend className="type-label mb-3">
            Color: <span className="text-ink-muted">{color}</span>
          </legend>
          <div className="flex gap-2">
            {colors.map((c) => (
              <label
                key={c.name}
                title={c.name}
                className="grid size-11 place-items-center rounded-full border border-transparent transition-colors has-checked:border-ink has-focus-visible:outline has-focus-visible:outline-ink"
              >
                <input
                  type="radio"
                  name="color"
                  value={c.name}
                  checked={color === c.name}
                  onChange={() => {
                    setColor(c.name);
                    setAdded(false);
                  }}
                  className="sr-only"
                />
                <span
                  className="size-8 rounded-full border border-line"
                  style={{ backgroundColor: c.value }}
                />
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {oneSize ? (
        <p className="type-label">
          Size: <span className="text-ink-muted">One size</span>
        </p>
      ) : (
        <div className="relative">
          <fieldset aria-describedby={error ? `${id}-size-error` : undefined}>
            <legend className="type-label mb-3">
              Size{size ? <span className="text-ink-muted">: {size}</span> : null}
            </legend>
            {/* One row for up to 6 sizes; 3 per row in the narrow tablet column */}
            <div
              className="grid grid-cols-(--size-cols) gap-2 md:max-lg:grid-cols-3"
              style={{
                ["--size-cols" as string]: `repeat(${Math.min(sizes.length, 6)}, minmax(0, 1fr))`,
              }}
            >
              {sizes.map((s, i) => {
                const unavailable = s.stock <= 0;
                return (
                  <label
                    key={s.label}
                    className={`flex min-h-control items-center justify-center border text-body-sm transition-colors has-checked:border-ink has-checked:bg-ink has-checked:text-canvas has-focus-visible:outline has-focus-visible:outline-ink ${
                      unavailable
                        ? "cursor-not-allowed border-line text-ink-subtle line-through"
                        : error
                          ? "border-danger hover:border-ink"
                          : "border-line-strong hover:border-ink"
                    }`}
                  >
                    <input
                      ref={i === firstAvailable ? firstSizeRef : undefined}
                      type="radio"
                      name="size"
                      value={s.label}
                      disabled={unavailable}
                      checked={size === s.label}
                      onChange={() => {
                        setSize(s.label);
                        setError(false);
                        setAdded(false);
                      }}
                      className="sr-only"
                    />
                    {s.label}
                    {unavailable ? <span className="sr-only">, sold out</span> : null}
                  </label>
                );
              })}
            </div>
            {error ? (
              <p id={`${id}-size-error`} className="field-error" role="alert">
                Please select a size.
              </p>
            ) : null}
          </fieldset>
          {/* Outside the fieldset so it stays out of the size group's name */}
          <a href="#" className="btn btn-text absolute top-0 right-0">
            Size guide
          </a>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <StockStatus state={shownStock} label={shownLabel} />
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={soldOut}
          >
            {soldOut ? "Sold out" : "Add to bag"}
          </button>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className="btn btn-secondary btn-icon"
          >
            <HeartIcon fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        {soldOut ? (
          <a href="#" className="btn btn-secondary btn-block">
            Find in store
          </a>
        ) : null}
        <p role="status" className="min-h-5 text-body-sm">
          {added
            ? `Added to bag: ${productName}${oneSize ? "" : `, size ${size}`}${colors.length > 1 ? `, ${color}` : ""}.`
            : ""}
        </p>
      </div>
    </form>
  );
}
