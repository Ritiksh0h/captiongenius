"use client";

import { useState } from "react";
import Link from "next/link";

type Props = { used: number; limit: number };

export function UsageIndicator({ used, limit }: Props) {
  const [open, setOpen] = useState(false);

  const pct      = Math.min(used / limit, 1);
  const near     = pct >= 0.8;
  const full     = used >= limit;
  const color    = full ? "text-[#FF5A3C]" : near ? "text-amber-400" : "text-lime";
  const barColor = full ? "bg-[#FF5A3C]"   : near ? "bg-amber-400"   : "bg-lime";

  // Always 10 segments regardless of plan limit (prevents overflow on Plus/Pro)
  const SEGMENTS      = 10;
  const filledSegments = Math.round(pct * SEGMENTS);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-3 rounded-full border border-[#1a1a1a]
          bg-[#111111] px-4 py-2 transition-colors hover:border-[#2a2a2a]"
        aria-label={`${used} of ${limit} generations used`}
      >
        <span className={`font-mono text-xs ${color}`}>
          {used} / {limit}
        </span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-2.5 rounded-full transition-colors ${
                i < filledSegments ? barColor : "bg-[#2a2a2a]"
              }`}
            />
          ))}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl
          border border-[#1a1a1a] bg-[#111111] p-4 shadow-2xl text-left">
          <p className="text-sm text-[#F7F6F1] mb-0.5">
            {used} of {limit} captions used this month
          </p>
          <p className="text-xs text-[#6B6F76] mb-3">
            {Math.max(0, limit - used)} remaining
          </p>
          {!full ? (
            <div className="w-full h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          ) : (
            <Link
              href="/#pricing"
              className="block w-full text-center py-2 rounded-full
                bg-lime text-ink text-xs font-bold hover:scale-[1.02]
                transition-transform"
            >
              Upgrade for more →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
