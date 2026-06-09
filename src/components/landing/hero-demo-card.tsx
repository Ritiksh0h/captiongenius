"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RefreshCw, ImageIcon } from "lucide-react";
import { HERO_TONES } from "@/lib/captions";

export function HeroDemoCard() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [sparkKey, setSparkKey] = useState(0);
  const [flapKey, setFlapKey] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const tone = HERO_TONES[index];

  useEffect(() => {
    setTyped("");
    setFlapKey((k) => k + 1);
    let i = 0;
    const full = tone.caption;
    const interval = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(interval);
        setSparkKey((k) => k + 1);
        const hold = setTimeout(
          () => setIndex((p) => (p + 1) % HERO_TONES.length),
          2600
        );
        timers.current.push(hold);
      }
    }, 28);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const isComplete = typed.length === tone.caption.length;

  return (
    <div className="relative w-full max-w-[340px] rotate-0 transition-transform duration-500 sm:max-w-[400px] sm:-rotate-2 sm:hover:rotate-0">
      <div
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-lime/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl shadow-black/40">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src="/photo-coffee.png"
            alt="A latte in a ceramic cup on a wooden desk"
            fill
            priority
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <span className="size-1.5 rounded-full bg-lime" />
            Generating · {tone.label}
          </div>
        </div>

        <div className="space-y-3 p-5">
          <p
            key={flapKey}
            className="animate-flap min-h-[3.5rem] text-pretty font-sans text-[15px] leading-relaxed text-card-foreground"
            style={{ transformOrigin: "top center" }}
          >
            {typed}
            <span className="relative">
              <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-coral align-middle animate-cursor" />
              {isComplete && (
                <span
                  key={sparkKey}
                  className="animate-spark absolute -right-1 top-0 size-3 rounded-full bg-coral"
                  aria-hidden="true"
                />
              )}
            </span>
          </p>

          <div className="flex flex-wrap gap-1.5">
            {tone.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" />
              coffee.jpg
            </span>
            <button
              type="button"
              onClick={() => setIndex((p) => (p + 1) % HERO_TONES.length)}
              className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-lime transition-colors hover:bg-ink/90"
            >
              <RefreshCw className="size-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
