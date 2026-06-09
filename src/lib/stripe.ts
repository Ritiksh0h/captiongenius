import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

// Map plan names to Stripe price IDs
export const PRICE_IDS: Record<"plus" | "pro", string> = {
  plus: process.env.STRIPE_PLUS_PRICE_ID!,
  pro:  process.env.STRIPE_PRO_PRICE_ID!,
};

// Map a Stripe price ID back to a role name (used in the webhook)
export function priceIdToRole(priceId: string): "plus" | "pro" | null {
  if (priceId === process.env.STRIPE_PLUS_PRICE_ID) return "plus";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)  return "pro";
  return null;
}
