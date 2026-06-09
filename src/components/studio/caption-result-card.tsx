"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import type { GeneratedCaption } from "@/lib/captions";

type Props = {
  index: number;
  caption: GeneratedCaption;
  showHashtags: boolean;
};

export function CaptionResultCard({ index, caption, showHashtags }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const text =
      showHashtags && caption.hashtags.length > 0
        ? `${caption.text}\n\n${caption.hashtags.join(" ")}`
        : caption.text;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-xl border border-[#1a1a1a] bg-[#111111] p-5 transition-colors hover:border-lime/30"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs text-lime">
          {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy caption"}
          className="shrink-0 rounded-md border border-[#1a1a1a] p-1.5 text-[#6B6F76] transition-colors hover:border-lime/40 hover:text-lime"
        >
          {copied ? (
            <Check className="h-4 w-4 text-lime" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-[#F7F6F1]">
        {caption.text}
      </p>
      {showHashtags && caption.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {caption.hashtags.map((h) => (
            <span key={h} className="text-sm text-lime">
              {h}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
