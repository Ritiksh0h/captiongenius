"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TIERS = [
  {
    name:      "Free",
    price:     "$0",
    cadence:   "forever",
    plan:      null as null,           // null = no checkout, go to dashboard
    line:      "Start free, no card. 5 captions a month to feel the magic.",
    cta:       "Start free",
    highlight: false,
  },
  {
    name:      "Plus",
    price:     "$9.99",
    cadence:   "/mo",
    plan:      "plus" as const,
    line:      "50 captions, every style, every language — for people who post a lot.",
    cta:       "Get Plus",
    highlight: true,
  },
  {
    name:      "Pro",
    price:     "$29.99",
    cadence:   "/mo",
    plan:      "pro" as const,
    line:      "200 captions for people who post for a living.",
    cta:       "Go Pro",
    highlight: false,
  },
];

export function Pricing() {
  const { data: session }     = useSession();
  const router                = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: "plus" | "pro") {
    if (!session?.user) {
      signIn("google");
      return;
    }

    setLoading(plan);
    try {
      const res  = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="bg-background py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-coral">
            Pricing
          </span>
          <h2 className="mt-3 text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Start free. Upgrade when you&apos;re hooked.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3 md:items-center">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-3xl border p-7 ${
                tier.highlight
                  ? "border-lime bg-ink text-white shadow-2xl shadow-lime/10 md:scale-105"
                  : "border-border bg-card text-card-foreground"
              }`}
            >
              {tier.highlight && (
                <span className="mb-4 w-fit rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold">
                  {tier.price}
                </span>
                <span className={tier.highlight ? "text-white/60" : "text-muted-foreground"}>
                  {tier.cadence}
                </span>
              </div>
              <p className={`mt-4 flex-1 text-pretty text-sm leading-relaxed ${
                tier.highlight ? "text-white/70" : "text-muted-foreground"
              }`}>
                {tier.line}
              </p>
              <button
                type="button"
                // Free tier has plan=null. Never disable or show spinner for it —
                // null === null would be true without this guard.
                disabled={tier.plan !== null && loading === tier.plan}
                onClick={() => {
                  if (!tier.plan) {
                    router.push("/dashboard");
                  } else {
                    handleCheckout(tier.plan);
                  }
                }}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full
                  px-5 py-3 font-display text-sm font-bold
                  transition-transform hover:scale-[1.03] active:scale-95
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 ${
                  tier.highlight
                    ? "bg-lime text-lime-foreground"
                    : "bg-ink text-lime"
                }`}
              >
                {tier.plan !== null && loading === tier.plan ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Check className="size-4" />
                )}
                {tier.plan !== null && loading === tier.plan ? "Loading..." : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
