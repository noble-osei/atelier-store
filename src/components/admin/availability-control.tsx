"use client";

import { useActionState } from "react";

import { submitAvailability, type AvailabilityState } from "@/app/admin/products/actions";

const initialState: AvailabilityState = { error: null };

// Hides a product from the storefront, or puts it back. Hiding is reversible and
// keeps the product's orders and stock rows.
export function AvailabilityControl({ productId, hidden }: { productId: number; hidden: boolean }) {
  const [state, action, pending] = useActionState(submitAvailability, initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-3 border border-line p-6">
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="hide" value={hidden ? "0" : "1"} />
      <p className="type-label">Availability</p>
      <p className="max-w-prose text-body-sm text-ink-muted">
        {hidden
          ? "This product is hidden: it is not shown in the store or search, its page returns not found, and it cannot be bought."
          : "This product is available in the store."}
      </p>
      {state.error ? (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}>
        {pending ? "Saving…" : hidden ? "Make available" : "Hide from the store"}
      </button>
    </form>
  );
}
