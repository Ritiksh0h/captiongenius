"use client";

import { useState } from "react";
import {
  Bird, Briefcase, Camera, Globe,
  MapPin, MessageCircle, Music2, RefreshCw, Sparkles,
} from "lucide-react";
import {
  CAPTION_STYLES, GEN_TONES, LENGTHS, PLATFORMS,
  type LengthId, type PlatformId,
} from "@/lib/captions";

export type ConfigState = {
  description: string;
  platform:    PlatformId;
  styles:      string[];
  tone:        string;
  length:      LengthId;
  language:    string;
  hashtags:    boolean;
};

const PLATFORM_ICONS: Record<PlatformId, React.ComponentType<{ className?: string }>> = {
  instagram: Camera,
  twitter:   Bird,
  linkedin:  Briefcase,
  tiktok:    Music2,
  facebook:  MessageCircle,
  pinterest: MapPin,
};

// Style selection limits per plan — logic unchanged
const STYLE_LIMITS: Record<string, number> = {
  free: 1,
  plus: 3,
  pro:  5,
};

type DescribeStatus = "idle" | "loading" | "done" | "quota" | "error";

type Props = {
  config:          ConfigState;
  setConfig:       React.Dispatch<React.SetStateAction<ConfigState>>;
  onRedescribe:    () => void;
  describeStatus?: DescribeStatus;
  role?:           string;
};

export function ConfigForm({ config, setConfig, onRedescribe, describeStatus, role }: Props) {
  const [showAllStyles, setShowAllStyles] = useState(false);
  const visibleStyles = showAllStyles ? CAPTION_STYLES : CAPTION_STYLES.slice(0, 12);

  const maxStyles = STYLE_LIMITS[role ?? "free"] ?? 1;
  const atLimit   = config.styles.length >= maxStyles;

  function toggleStyle(style: string) {
    setConfig((c) => {
      const isSelected = c.styles.includes(style);
      if (!isSelected && c.styles.length >= maxStyles) return c;
      return {
        ...c,
        styles: isSelected
          ? c.styles.filter((s) => s !== style)
          : [...c.styles, style],
      };
    });
  }

  return (
    <div className="flex flex-col divide-y divide-[#141414]">

      {/* ── Image description ──────────────────────────────────────────── */}
      <section className="py-6 first:pt-0">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
            What&apos;s in this photo?
          </p>
          <button
            type="button"
            onClick={onRedescribe}
            className="flex items-center gap-1 text-[11px] text-[#525252]
              hover:text-lime transition-colors"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Re-describe
          </button>
        </div>

        {describeStatus === "loading" ? (
          <div className="h-10 w-full rounded-lg bg-[#141414] animate-pulse" />
        ) : (
          <input
            value={config.description}
            onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))}
            placeholder="A golden retriever running in a sunlit park…"
            className="w-full rounded-lg border-0 bg-[#141414] px-3.5 py-2.5
              text-sm text-[#F7F6F1] outline-none ring-1 ring-transparent
              placeholder:text-[#3a3a3a] focus:ring-lime/30 transition-all"
          />
        )}

        {describeStatus === "loading" && (
          <p className="mt-2 text-[11px] text-[#525252] animate-pulse">
            Analysing image…
          </p>
        )}
        {describeStatus === "quota" && (
          <p className="mt-2 text-[11px] text-amber-500/80">
            Auto-describe unavailable —{" "}
            <button type="button" onClick={onRedescribe}
              className="underline hover:text-amber-400">retry</button>{" "}
            or type above.
          </p>
        )}
        {describeStatus === "error" && (
          <p className="mt-2 text-[11px] text-[#FF5A3C]/80">
            Could not describe —{" "}
            <button type="button" onClick={onRedescribe}
              className="underline hover:opacity-80">retry</button>{" "}
            or type above.
          </p>
        )}
      </section>

      {/* ── Platform ───────────────────────────────────────────────────── */}
      <section className="py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          Platform
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const Icon   = PLATFORM_ICONS[p.id];
            const active = config.platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, platform: p.id }))}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5
                  text-[13px] font-medium transition-all ${
                  active
                    ? "bg-lime text-[#0A0A0A] shadow-[0_0_12px_rgba(199,240,53,0.25)]"
                    : "bg-[#141414] text-[#525252] hover:text-[#F7F6F1] hover:bg-[#1c1c1c]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Caption style ──────────────────────────────────────────────── */}
      <section className="py-6">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
            Caption style
          </p>
          <span className="text-[11px] text-[#525252]">
            {config.styles.length} / {maxStyles} selected
            {(role === "free" || !role) && (
              <a href="/#pricing" className="ml-1.5 text-lime hover:underline">
                upgrade
              </a>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {visibleStyles.map((style) => {
            const active  = config.styles.includes(style);
            const blocked = !active && atLimit;
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                disabled={blocked}
                title={blocked ? `Upgrade to select more than ${maxStyles} style${maxStyles > 1 ? "s" : ""}` : undefined}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-lime text-[#0A0A0A] shadow-[0_0_12px_rgba(199,240,53,0.2)]"
                    : blocked
                    ? "bg-[#141414] text-[#3a3a3a] opacity-30 cursor-not-allowed"
                    : "bg-[#141414] text-[#525252] hover:text-[#F7F6F1] hover:bg-[#1c1c1c]"
                }`}
              >
                {style}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAllStyles((s) => !s)}
            className="rounded-full px-3 py-1.5 text-[13px] text-lime/70
              hover:text-lime transition-colors"
          >
            {showAllStyles ? "Show less" : "Show all 30+"}
          </button>
        </div>
      </section>

      {/* ── Tone ───────────────────────────────────────────────────────── */}
      <section className="py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          Tone
        </p>
        <div className="flex flex-wrap gap-1.5">
          {GEN_TONES.map((tone) => {
            const active = config.tone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, tone }))}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium
                  transition-all ${
                  active
                    ? "bg-lime text-[#0A0A0A] shadow-[0_0_12px_rgba(199,240,53,0.2)]"
                    : "bg-[#141414] text-[#525252] hover:text-[#F7F6F1] hover:bg-[#1c1c1c]"
                }`}
              >
                {tone}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Length ─────────────────────────────────────────────────────── */}
      <section className="py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          Length
        </p>
        <div className="inline-flex rounded-full bg-[#141414] p-[3px] gap-[2px]">
          {LENGTHS.map((l) => {
            const active = config.length === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, length: l.id }))}
                className={`rounded-full px-5 py-1.5 text-[13px] font-medium
                  transition-all ${
                  active
                    ? "bg-lime text-[#0A0A0A] shadow-[0_0_12px_rgba(199,240,53,0.2)]"
                    : "text-[#525252] hover:text-[#F7F6F1]"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Language ───────────────────────────────────────────────────── */}
      <section className="py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#525252]">
          Language
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-[#141414]
          px-3.5 py-2.5 ring-1 ring-transparent focus-within:ring-lime/30
          transition-all">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[#525252]" />
          <input
            value={config.language}
            onChange={(e) => setConfig((c) => ({ ...c, language: e.target.value }))}
            placeholder="English (default)"
            className="w-full bg-transparent text-sm text-[#F7F6F1]
              outline-none placeholder:text-[#3a3a3a]"
          />
        </div>
      </section>

      {/* ── Hashtags ───────────────────────────────────────────────────── */}
      <section className="py-6">
        <button
          type="button"
          onClick={() => setConfig((c) => ({ ...c, hashtags: !c.hashtags }))}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="block text-[13px] font-medium text-[#F7F6F1]">
              Include hashtags
            </span>
            <span className="block text-[11px] text-[#525252] mt-0.5">
              5–8 relevant tags added per caption.
            </span>
          </span>
          <span className={`relative h-[22px] w-10 shrink-0 rounded-full
            transition-colors ${config.hashtags ? "bg-lime" : "bg-[#2a2a2a]"}`}>
            <span className={`absolute top-[3px] h-4 w-4 rounded-full
              bg-[#0A0A0A] shadow-sm transition-all ${
              config.hashtags ? "left-[22px]" : "left-[3px]"
            }`} />
          </span>
        </button>
      </section>

      <div className="h-1" />
    </div>
  );
}

export { Sparkles };
