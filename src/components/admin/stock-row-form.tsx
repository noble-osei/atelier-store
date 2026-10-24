"use client";

import { useActionState } from "react";

import { submitStock, type StockState } from "@/app/admin/stock/actions";
import { LIMITS } from "@/lib/product-input";

const initialState: StockState = { error: null };

// One size's quantity. `expected` is what the admin is looking at: the server only
// writes if the row still holds it, so a stale page cannot undo a checkout. The
// server validates everything again; the attributes here are just hints.
export function StockRowForm({
  productId,
  productName,
  size,
  quantity,
}: {
  productId: number;
  productName: string;
  size: string;
  quantity: number;
}) {
  const [state, action, pending] = useActionState(submitStock, initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="size" value={size} />
      <input type="hidden" name="expected" value={quantity} />
      <div className="flex items-center gap-2">
        <input
          // Remounts when the stored quantity changes, so the field shows the new value.
          key={quantity}
          type="number"
          name="quantity"
          defaultValue={quantity}
          min={0}
          max={LIMITS.quantity}
          step={1}
          inputMode="numeric"
          required
          aria-label={`Quantity of ${productName}, ${size}`}
          aria-invalid={state.error ? true : undefined}
          className="input w-28"
        />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="field-error max-w-prose">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
