"use client";

import { useState } from "react";
import {
  Bird,
  Briefcase,
  Camera,
  Globe,
  MapPin,
  MessageCircle,
  Music2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  CAPTION_STYLES,
  GEN_TONES,
  LENGTHS,
  PLATFORMS,
  type LengthId,
  type PlatformId,
} from "@/lib/captions";

export type ConfigState = {
  description: string;
  platform: PlatformId;
  styles: string[];
  tone: string;
  length: LengthId;
  language: string;
  hashtags: boolean;
};

const PLATFORM_ICONS: Record<
  PlatformId,
  React.ComponentType<{ className?: string }>
> = {
  instagram: Camera,
  twitter: Bird,
  linkedin: Briefcase,
  tiktok: Music2,
  facebook: MessageCircle,
  pinterest: MapPin,
};

// Style selection limits per plan
const STYLE_LIMITS: Record<string, number> = {
  free:  1,
  plus:  3,
  pro:   5,
};

type DescribeStatus = "idle" | "loading" | "done" | "quota" | "error";

type Props = {
  config: ConfigState;
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>;
  onRedescribe: () => void;
  describeStatus?: DescribeStatus;
  role?: string;  // user's plan role — controls how many styles can be selected
};

export function ConfigForm({ config, setConfig, onRedescribe, describeStatus, role }: Props) {
  const [showAllStyles, setShowAllStyles] = useState(false);
  const visibleStyles = showAllStyles ? CAPTION_STYLES : CAPTION_STYLES.slice(0, 12);

  const maxStyles = STYLE_LIMITS[role ?? "free"] ?? 1;
  const atLimit   = config.styles.length >= maxStyles;

  function toggleStyle(style: string) {
    setConfig((c) => {
      const isSelected = c.styles.includes(style);
      // Block adding more if already at the limit
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
    <div className="flex flex-col gap-8">
      {/* Image description */}
      <Field>
        <div className="flex items-center justify-between">
          <Label>What&apos;s in this photo?</Label>
          <button
            type="button"
            onClick={onRedescribe}
            className="flex items-center gap-1.5 text-xs text-lime transition-opacity hover:opacity-80"
          >
            <RefreshCw className="h-3 w-3" />
            Re-describe
          </button>
        </div>
        {describeStatus === "loading" ? (
          <div className="w-full h-11 rounded-xl bg-[#1a1a1a] animate-pulse" />
        ) : (
          <input
            value={config.description}
            onChange={(e) =>
              setConfig((c) => ({ ...c, description: e.target.value }))
            }
            placeholder="Describe your photo…"
            className="w-full rounded-xl border border-[#1a1a1a] bg-[#111111] px-4 py-3 text-sm text-[#F7F6F1] outline-none transition-colors placeholder:text-[#6B6F76] focus:border-lime/50"
          />
        )}
        {describeStatus === "loading" && (
          <p className="text-xs text-[#6B6F76] mt-1.5 animate-pulse">
            Describing image…
          </p>
        )}
        {describeStatus === "quota" && (
          <p className="text-xs text-amber-400 mt-1.5">
            AI description unavailable right now — type a description or{" "}
            <button
              type="button"
              className="underline hover:text-amber-300"
              onClick={onRedescribe}
            >
              retry
            </button>
          </p>
        )}
        {describeStatus === "error" && (
          <p className="text-xs text-[#FF5A3C] mt-1.5">
            Could not describe image —{" "}
            <button
              type="button"
              className="underline hover:opacity-80"
              onClick={onRedescribe}
            >
              retry
            </button>{" "}
            or type a description manually.
          </p>
        )}
      </Field>

      {/* Platform */}
      <Field>
        <Label>Platform</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const Icon = PLATFORM_ICONS[p.id];
            const active = config.platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, platform: p.id }))}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-lime text-[#0A0A0A]"
                    : "border border-[#1a1a1a] bg-[#1a1a1a] text-[#6B6F76] hover:text-[#F7F6F1]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Caption style */}
      <Field>
        <div className="flex items-center justify-between gap-2">
          <Label>Caption style</Label>
          <span className="text-[11px] text-[#6B6F76] whitespace-nowrap">
            {config.styles.length} / {maxStyles} selected
            {(role === "free" || !role) && (
              <a
                href="/#pricing"
                className="ml-1.5 text-lime hover:underline"
              >
                upgrade for more
              </a>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleStyles.map((style) => {
            const active    = config.styles.includes(style);
            const blocked   = !active && atLimit;
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                disabled={blocked}
                title={blocked ? `Upgrade to select more than ${maxStyles} style${maxStyles > 1 ? "s" : ""}` : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-lime text-[#0A0A0A]"
                    : blocked
                    ? "border border-[#1a1a1a] bg-[#1a1a1a] text-[#6B6F76] opacity-30 cursor-not-allowed"
                    : "border border-[#1a1a1a] bg-[#1a1a1a] text-[#6B6F76] hover:text-[#F7F6F1]"
                }`}
              >
                {style}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAllStyles((s) => !s)}
            className="rounded-full px-3.5 py-1.5 text-sm text-lime transition-opacity hover:opacity-80"
          >
            {showAllStyles ? "Show less" : "Show all 30+"}
          </button>
        </div>
      </Field>

      {/* Tone */}
      <Field>
        <Label>Tone</Label>
        <div className="flex flex-wrap gap-2">
          {GEN_TONES.map((tone) => {
            const active = config.tone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, tone }))}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-lime text-[#0A0A0A]"
                    : "border border-[#1a1a1a] bg-[#1a1a1a] text-[#6B6F76] hover:text-[#F7F6F1]"
                }`}
              >
                {tone}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Length */}
      <Field>
        <Label>Length</Label>
        <div className="inline-flex rounded-full border border-[#1a1a1a] bg-[#111111] p-1">
          {LENGTHS.map((l) => {
            const active = config.length === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, length: l.id }))}
                className={`rounded-full px-5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-lime text-[#0A0A0A]"
                    : "text-[#6B6F76] hover:text-[#F7F6F1]"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Language */}
      <Field>
        <Label>Language</Label>
        <div className="flex items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#111111] px-4 py-3 focus-within:border-lime/50">
          <Globe className="h-4 w-4 shrink-0 text-[#6B6F76]" />
          <input
            value={config.language}
            onChange={(e) =>
              setConfig((c) => ({ ...c, language: e.target.value }))
            }
            placeholder="English (default)"
            className="w-full bg-transparent text-sm text-[#F7F6F1] outline-none placeholder:text-[#6B6F76]"
          />
        </div>
      </Field>

      {/* Hashtags toggle */}
      <Field>
        <button
          type="button"
          onClick={() =>
            setConfig((c) => ({ ...c, hashtags: !c.hashtags }))
          }
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="block text-sm text-[#F7F6F1]">
              Include hashtags
            </span>
            <span className="block text-xs text-[#6B6F76]">
              5&ndash;8 relevant tags added to each caption.
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              config.hashtags ? "bg-lime" : "bg-[#2a2a2a]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0A0A0A] transition-all ${
                config.hashtags ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </Field>

      <div className="h-2" />
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-heading text-sm font-semibold tracking-wide text-[#F7F6F1]">
      {children}
    </span>
  );
}

export { Sparkles };
