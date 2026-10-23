"use client";

import { useActionState } from "react";

import { releaseCheckout, resumeCheckout } from "@/app/checkout/actions";

// Shown while the customer has an open payment page: their items are off the
// shelf for a short time. They can go back to pay or give the items up. Both
// buttons are disabled while either action runs, so a second click cannot race
// the first.
export function CheckoutHold({
  minutesLeft,
  canceled,
}: {
  minutesLeft: number;
  canceled: boolean;
}) {
  const [, resume, resuming] = useActionState(resumeCheckout, undefined);
  const [, release, releasing] = useActionState(releaseCheckout, undefined);
  const busy = resuming || releasing;

  return (
    <div
      role="status"
      aria-busy={busy}
      className="flex flex-col gap-4 border border-line-strong p-4"
    >
      <div className="flex flex-col gap-1">
        <p className="text-body-sm">
          {canceled
            ? "You left the payment page, so nothing was charged."
            : "Your items are being held while you check out."}
        </p>
        <p className="text-caption text-ink-muted">
          They stay reserved for about {minutesLeft} more {minutesLeft === 1 ? "minute" : "minutes"}.
          Continue to payment, or release them to change your bag.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={resume}>
          <button type="submit" disabled={busy} className="btn btn-primary max-sm:w-full">
            {resuming ? "Opening payment…" : "Continue to payment"}
          </button>
        </form>
        <form action={release}>
          <button type="submit" disabled={busy} className="btn btn-secondary max-sm:w-full">
            {releasing ? "Releasing…" : "Release items"}
          </button>
        </form>
      </div>
    </div>
  );
}
