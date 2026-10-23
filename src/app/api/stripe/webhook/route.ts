import { failSession, orderIdOf, settleSession } from "@/lib/checkout";
import { claimStripeEvent, finishStripeEvent } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Stripe webhook. The signature is the only authentication here: it proves the
// body came from Stripe. Order state is then decided from a Session fetched
// from Stripe, never from the event's age or arrival order, and every state
// change is a guarded transition, so redelivered or reordered events are safe.

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret) {
    // Our misconfiguration, not a bad request: fail loudly so Stripe retries later.
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature covers the exact bytes Stripe sent, so read the raw text.
  const body = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (!(await claimStripeEvent(event.id, event.type))) {
      return Response.json({ received: true, duplicate: true });
    }

    let orderId: string | null = null;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired": {
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id);
        orderId = orderIdOf(session);
        await settleSession(session);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id);
        orderId = orderIdOf(session);
        await failSession(session);
        break;
      }
      default:
        // Not subscribed to anything else; acknowledge so Stripe stops retrying.
        break;
    }

    await finishStripeEvent(event.id, orderId);
    return Response.json({ received: true });
  } catch (error) {
    // Leave processed_at empty and answer 500: Stripe retries, and the handler
    // is idempotent, so running it again is safe.
    console.error(`Stripe webhook ${event.id} (${event.type}) failed`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
