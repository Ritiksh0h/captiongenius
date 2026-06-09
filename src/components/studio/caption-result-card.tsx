"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Check, Copy, Pencil, X } from "lucide-react";
import type { GeneratedCaption } from "@/lib/captions";

type Props = {
  index:         number;
  caption:       GeneratedCaption;
  showHashtags:  boolean;
  onEdit?:       (index: number, newText: string) => void;
  onFavourite?:  (index: number) => void;
  isFavourited?: boolean;
};

export function CaptionResultCard({
  index,
  caption,
  showHashtags,
  onEdit,
  onFavourite,
  isFavourited,
}: Props) {
  const [copied,   setCopied]   = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(caption.text);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    setEditText(caption.text);
    setEditing(false);
  }, [caption.text]);

  function copy() {
    const text =
      showHashtags && caption.hashtags.length > 0
        ? `${caption.text}\n\n${caption.hashtags.join(" ")}`
        : caption.text;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function saveEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== caption.text) {
      onEdit?.(index, trimmed);
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditText(caption.text);
    setEditing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative rounded-2xl border p-5 transition-all ${
        editing
          ? "border-lime/40 bg-[#0d0d0d]"
          : caption.edited
          ? "border-lime/15 bg-[#0d0d0d]"
          : "border-[#141414] bg-[#0d0d0d] hover:border-[#1f1f1f]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#3a3a3a]">
            {String(index + 1).padStart(2, "0")}
          </span>
          {caption.edited && (
            <span className="rounded-full bg-lime/10 px-1.5 py-0.5 text-[10px] font-medium text-lime">
              edited
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit caption"
              className="rounded-lg border border-[#1a1a1a] p-1.5 text-[#3a3a3a]
                opacity-0 group-hover:opacity-100 transition-all
                hover:border-[#2a2a2a] hover:text-[#F7F6F1]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {!editing && (
            <button
              type="button"
              onClick={() => onFavourite?.(index)}
              aria-label={isFavourited ? "Remove from favourites" : "Save to favourites"}
              className={`rounded-lg border p-1.5 transition-all ${
                isFavourited
                  ? "border-lime/30 bg-lime/10 text-lime"
                  : "border-[#1a1a1a] text-[#3a3a3a] opacity-0 group-hover:opacity-100 hover:border-[#2a2a2a] hover:text-[#F7F6F1]"
              }`}
            >
              {isFavourited
                ? <BookmarkCheck className="h-3.5 w-3.5" />
                : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          )}

          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Cancel edit"
                className="rounded-lg border border-[#1a1a1a] p-1.5 text-[#525252]
                  hover:border-[#FF5A3C]/30 hover:text-[#FF5A3C] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={saveEdit}
                aria-label="Save edit"
                className="rounded-lg border border-lime/30 bg-lime/10 p-1.5
                  text-lime transition-colors hover:bg-lime/20"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy caption"}
              className="rounded-lg border border-[#1a1a1a] p-1.5 text-[#3a3a3a]
                transition-colors hover:border-[#2a2a2a] hover:text-[#F7F6F1]"
            >
              {copied
                ? <Check className="h-4 w-4 text-lime" />
                : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          rows={3}
          className="mt-3 w-full resize-none rounded-xl border border-lime/20
            bg-[#141414] px-3.5 py-2.5 text-[15px] leading-[1.65] text-[#e8e8e8]
            outline-none focus:border-lime/40 transition-colors"
        />
      ) : (
        <p className="mt-3 text-[15px] leading-[1.65] text-[#e8e8e8]">
          {caption.text}
        </p>
      )}

      {!editing && showHashtags && caption.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1">
          {caption.hashtags.map((h) => (
            <span key={h} className="text-[12px] text-lime/70">{h}</span>
          ))}
        </div>
      )}

      {editing && (
        <p className="mt-2 text-[10px] text-[#3a3a3a]">⌘↵ to save · Esc to cancel</p>
      )}
    </motion.div>
  );
}
