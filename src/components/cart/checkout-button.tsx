"use client";

import { useActionState } from "react";

import { startCheckout, type CheckoutState } from "@/app/checkout/actions";

const INITIAL: CheckoutState = { error: null };

// Asks the server to check out the bag. It sends nothing about the contents:
// the server reads the cart cookie, re-prices it and re-checks stock itself.
export function CheckoutButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(startCheckout, INITIAL);

  return (
    <form action={action} aria-busy={pending} className="flex flex-col gap-2">
      <button type="submit" className="btn btn-primary btn-block" disabled={disabled || pending}>
        {pending ? "Starting checkout…" : "Checkout"}
      </button>
      {pending ? (
        <p role="status" className="text-caption text-ink-muted">
          Reserving your items and opening secure payment. Please keep this page open.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
