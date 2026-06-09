import { NextRequest, NextResponse } from "next/server";
import { stripe, priceIdToRole } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// App Router does NOT pre-parse request bodies — req.text() gives the raw bytes
// that Stripe's signature verification requires. No special config needed.

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  // Let TypeScript infer the event type from constructEvent's return type —
  // avoids the Stripe namespace type access issues with moduleResolution: node
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log(`[webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      // ── New subscription / upgrade ─────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId as string | undefined;
        if (!userId) { console.error("[webhook] No userId in metadata"); break; }

        const sub     = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id;
        const role    = priceIdToRole(priceId);

        if (!role) { console.error("[webhook] Unknown price ID:", priceId); break; }

        await db
          .update(users)
          .set({
            role,
            stripeSubscriptionId: sub.id,
            stripeCustomerId:     session.customer as string,
          })
          .where(eq(users.id, userId));

        console.log(`[webhook] Upgraded user ${userId} to ${role}`);
        break;
      }

      // ── Monthly renewal — reset caption counter ────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as any;
        // "subscription_create" is handled by checkout.session.completed above
        if (invoice.billing_reason === "subscription_create") break;

        const subId = typeof invoice.subscription === "string"
          ? invoice.subscription as string
          : (invoice.subscription as any)?.id as string | undefined;
        if (!subId) break;

        const sub     = await stripe.subscriptions.retrieve(subId);
        const userId  = sub.metadata?.userId;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id;
        const role    = priceIdToRole(priceId);
        if (!role) break;

        await db
          .update(users)
          .set({ role, captionsUsed: 0, resetDate: new Date() })
          .where(eq(users.id, userId));

        console.log(`[webhook] Renewed ${role} for user ${userId} — counter reset`);
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub    = event.data.object as any;
        const userId = sub.metadata?.userId as string | undefined;
        if (!userId) break;

        await db
          .update(users)
          .set({ role: "free", stripeSubscriptionId: null })
          .where(eq(users.id, userId));

        console.log(`[webhook] Cancelled subscription for user ${userId} → free`);
        break;
      }

      // ── Payment failed — downgrade ─────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subId   = typeof invoice.subscription === "string"
          ? invoice.subscription as string
          : (invoice.subscription as any)?.id as string | undefined;
        if (!subId) break;

        const sub    = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await db
          .update(users)
          .set({ role: "free", stripeSubscriptionId: null })
          .where(eq(users.id, userId));

        console.log(`[webhook] Payment failed for user ${userId} → free`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Return 200 so Stripe doesn't retry infinitely — the error is logged above
    return new NextResponse("Handler error (logged)", { status: 200 });
  }

  return new NextResponse("OK", { status: 200 });
}
