import { timingSafeEqual } from "node:crypto";

import { releaseOrder, getStalePendingOrders } from "@/lib/orders";
import { revalidateProducts, settleSessionById } from "@/lib/checkout";

// Safety net for missed webhooks. Run every ~10 minutes from the host's
// scheduler with `Authorization: Bearer $CRON_SECRET`. It looks at pending
// orders whose hold ended a few minutes ago and asks Stripe what really
// happened: paid orders become paid, expired ones give their stock back, and
// delayed payments that are still processing keep their hold.

const GRACE_MS = 5 * 60_000;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never open when unconfigured
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });

  const stale = await getStalePendingOrders(new Date(Date.now() - GRACE_MS));
  const outcomes: Record<string, number> = {};

  for (const order of stale) {
    try {
      let outcome: string;
      if (order.stripeCheckoutSessionId) {
        outcome = await settleSessionById(order.stripeCheckoutSessionId);
      } else if (await releaseOrder(order.publicId, "expired")) {
        // The hold ended and no Stripe session was ever attached.
        revalidateProducts();
        outcome = "released";
      } else {
        outcome = "unchanged";
      }
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    } catch (error) {
      console.error(`Reconciling order ${order.publicId} failed`, error);
      outcomes.error = (outcomes.error ?? 0) + 1;
    }
  }

  return Response.json({ checked: stale.length, outcomes });
}
