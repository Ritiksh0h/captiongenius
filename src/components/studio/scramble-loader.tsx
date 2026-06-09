"use client";

import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#@!?*…";

function randomLine(len: number) {
  let s = "";
  for (let i = 0; i < len; i++)
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export function ScrambleLoader() {
  const [lines, setLines] = useState<string[]>(() =>
    Array.from({ length: 5 }, () => randomLine(38))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setLines((prev) =>
        prev.map(() => randomLine(28 + Math.floor(Math.random() * 18)))
      );
    }, 70);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex h-full flex-col justify-center gap-4"
      aria-live="polite"
      aria-label="Generating captions"
    >
      <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-lime">
        Reading the photo
        <span className="inline-block h-3 w-1.5 animate-cursor bg-lime" />
      </p>
      {lines.map((line, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#111111] px-5 py-4"
        >
          <span className="select-none font-mono text-sm text-[#6B6F76] blur-[0.5px]">
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}
