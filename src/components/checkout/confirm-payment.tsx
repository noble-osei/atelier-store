"use client";

import { useEffect, useState } from "react";

import { confirmCheckout } from "@/app/checkout/actions";

const POLL_MS = 3000;
const MAX_POLLS = 10;

// Asks the server to confirm the order with Stripe. The action refreshes the
// page when the status changes, so this only keeps asking while payment is
// still being confirmed, then gives up with a note instead of spinning forever.
export function ConfirmPayment({ sessionId }: { sessionId: string }) {
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    async function check() {
      const { status } = await confirmCheckout(sessionId);
      if (cancelled || status !== "pending") return;
      polls += 1;
      if (polls >= MAX_POLLS) setGaveUp(true);
      else timer = setTimeout(check, POLL_MS);
    }
    void check();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  return gaveUp ? (
    <p role="status" className="text-body-sm text-ink-muted">
      Confirmation is taking longer than usual. You have not been charged twice: your order
      will update on its own once the payment is confirmed.
    </p>
  ) : null;
}
