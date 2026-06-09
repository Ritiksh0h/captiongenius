"use client";

import { useState } from "react";
import Image from "next/image";
import { EXPLORER_TONES } from "@/lib/captions";

export function CaptionExplorer() {
  const [active, setActive] = useState(0);
  const tone = EXPLORER_TONES[active];

  return (
    <section id="explore" className="bg-background py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-coral">
            Watch it think
          </span>
          <h2 className="mt-3 text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            One photo. Pick the mood. Read the result.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Tap a tone and the caption rewrites itself live. This is the actual
            engine — no signup to play.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl border border-border bg-card p-5 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/photo-dish.png"
              alt="A plated brunch dish with poached egg and microgreens"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 500px"
            />
          </div>

          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {EXPLORER_TONES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    i === active
                      ? "bg-ink text-lime"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <p
              key={tone.id}
              className="animate-flap min-h-[6rem] text-balance font-display text-2xl font-semibold leading-snug text-foreground sm:text-[28px]"
              style={{ transformOrigin: "top left" }}
            >
              {tone.caption}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {tone.hashtags.map((tag) => (
                <span key={tag} className="text-sm font-medium text-coral">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
