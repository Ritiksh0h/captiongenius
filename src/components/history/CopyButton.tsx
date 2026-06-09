"use client";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[10px] text-[#6B6F76] hover:text-lime transition-colors
        opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
}
