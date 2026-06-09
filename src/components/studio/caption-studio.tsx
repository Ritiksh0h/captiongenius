"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { type GeneratedCaption } from "@/lib/captions";
import { ConfigForm, type ConfigState } from "./config-form";
import { CaptionResultCard } from "./caption-result-card";
import { ScrambleLoader } from "./scramble-loader";
import { UsageIndicator } from "./usage-indicator";

type Photo = { url: string; name: string };
type View = "config" | "loading" | "output";
type DescribeStatus = "idle" | "loading" | "done" | "quota" | "error";

const LENGTH_MAP: Record<string, string> = {
  snappy:   "🚀 Snappy",
  standard: "📝 Standard",
  extended: "📜 Extended",
};

function parseCaptionString(text: string): GeneratedCaption {
  const words    = text.split(" ");
  const hashIdx  = words.findIndex((w) => w.startsWith("#"));
  if (hashIdx === -1) return { text, hashtags: [] };
  return {
    text:     words.slice(0, hashIdx).join(" ").trim(),
    hashtags: words.slice(hashIdx),
  };
}

type Props = {
  photoUrl: string;
  folderId: string;
  onBack: () => void;
  photos?: Photo[];
};

export function CaptionStudio({ photoUrl, folderId, onBack, photos }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const gallery: Photo[] =
    photos && photos.length > 0 ? photos : [{ url: photoUrl, name: "photo.png" }];

  const [activePhoto,     setActivePhoto]     = useState(gallery[0]);
  const [view,            setView]            = useState<View>("config");
  const [results,         setResults]         = useState<GeneratedCaption[]>([]);
  const [copiedAll,       setCopiedAll]       = useState(false);
  const [usage,           setUsage]           = useState<{ used: number; limit: number } | null>(null);
  const [describeStatus,  setDescribeStatus]  = useState<DescribeStatus>("idle");

  const [config, setConfig] = useState<ConfigState>({
    description: "",
    platform:    "instagram",
    styles:      ["Witty", "Storytelling"],
    tone:        "Playful",
    length:      "standard",
    language:    "",
    hashtags:    true,
  });

  // ── Usage fetch — memoized so both mount and post-generate can call it ──────
  const refreshUsage = useCallback(() => {
    if (!session?.user) return;
    fetch("/api/user/usage")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setUsage({ used: d.used, limit: d.limit }); })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  // ── Auto-describe when photo changes (300ms debounce to cancel stale races) ─
  useEffect(() => {
    if (!folderId || !activePhoto.name) return;

    setDescribeStatus("loading");

    const timer = setTimeout(() => {
      fetch("/api/describe-image", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ folderId, imageFileName: activePhoto.name }),
      })
        .then((r) => {
          if (!r.ok) {
            return r.json().then((e) => {
              if (e.quotaExhausted) { setDescribeStatus("quota"); return null; }
              throw new Error(e.error ?? `describe-image returned ${r.status}`);
            });
          }
          return r.json();
        })
        .then((data) => {
          if (!data) return;
          if (data.description) {
            setConfig((c) => ({ ...c, description: data.description }));
            setDescribeStatus("done");
            if (data.cached) console.log(`[studio] cache hit (${data.model})`);
          }
        })
        .catch((err) => {
          console.error("[describe-image] client error:", err);
          setDescribeStatus("error");
        });
    }, 300);

    return () => clearTimeout(timer); // cancel if photo changes again within 300ms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, activePhoto.name]);

  // ── Re-describe button ───────────────────────────────────────────────────
  async function redescribe() {
    if (!folderId || !activePhoto.name) return;
    setDescribeStatus("loading");
    try {
      const r = await fetch("/api/describe-image", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ folderId, imageFileName: activePhoto.name }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        if (e.quotaExhausted) { setDescribeStatus("quota"); return; }
        throw new Error(e.error ?? `describe-image returned ${r.status}`);
      }
      const data = await r.json();
      if (data.description) {
        setConfig((c) => ({ ...c, description: data.description }));
        setDescribeStatus("done");
      }
    } catch (err) {
      console.error("[describe-image] redescribe error:", err);
      setDescribeStatus("error");
      toast.error("Could not re-describe the image");
    }
  }

  // ── Generate captions ────────────────────────────────────────────────────
  async function generate() {
    if (!session?.user) { signIn("google"); return; }
    if (config.styles.length === 0) {
      toast.error("Select at least one caption style");
      return;
    }

    setView("loading");

    try {
      const res = await fetch("/api/generate-caption", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          folderId,
          imageDescription: config.description,
          platform:         config.platform,
          type:             config.styles,
          tone:             config.tone,
          length:           LENGTH_MAP[config.length] ?? "📝 Standard",
          language:         config.language || "English",
          hashtag:          config.hashtags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.rateLimited) {
          toast.error("Rate limited — please wait 30 seconds and try again.");
          setView("config");
          return;
        }
        if (data.limitReached) {
          toast.error(data.error || "Monthly limit reached", {
            description: "Upgrade your plan for more captions.",
            action: { label: "Upgrade", onClick: () => (window.location.href = "/#pricing") },
          });
          setView("config");
          return;
        }
        throw new Error(data.error ?? "Generation failed");
      }

      setResults((data.captions as string[]).map(parseCaptionString));
      setView("output");

      refreshUsage(); // Refresh usage counter
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setView("config");
    }
  }

  async function regenerate() { await generate(); }
  function backToOptions()    { setView("config"); }

  function copyAll() {
    const text = results
      .map((r, i) => {
        const tags = config.hashtags && r.hashtags.length > 0
          ? `\n${r.hashtags.join(" ")}`
          : "";
        return `${String(i + 1).padStart(2, "0")}. ${r.text}${tags}`;
      })
      .join("\n\n");
    navigator.clipboard?.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F6F1] lg:flex lg:h-screen lg:overflow-hidden">
      {/* Usage indicator — fixed top-right */}
      {usage && (
        <div className="fixed right-4 top-4 z-50">
          <UsageIndicator used={usage.used} limit={usage.limit} />
        </div>
      )}

      {/* LEFT PANEL — photo */}
      <aside className="border-b border-[#1a1a1a] bg-[#111111] p-5 lg:w-2/5 lg:border-b-0 lg:border-r lg:p-8">
        <div className="flex h-full flex-col">
          {view === "output" && (
            <button
              type="button"
              onClick={backToOptions}
              className="mb-4 inline-flex items-center gap-2 text-sm text-[#6B6F76] transition-colors hover:text-[#F7F6F1] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </button>
          )}

          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1a1a1a] lg:aspect-auto lg:flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.url || "/placeholder.svg"}
              alt={config.description || "Uploaded photo"}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-[#1a1a1a] px-3 py-1.5 text-xs text-[#6B6F76] transition-colors hover:border-[#2a2a2a] hover:text-[#F7F6F1]"
            >
              ← Back
            </button>
            <span className="truncate font-mono text-xs text-[#6B6F76]">
              {activePhoto.name}
            </span>
          </div>

          {gallery.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((p) => (
                <button
                  key={p.url + p.name}
                  type="button"
                  onClick={() => { setActivePhoto(p); setDescribeStatus("idle"); }}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    activePhoto.url === p.url ? "border-lime" : "border-[#1a1a1a]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT PANEL — config / loading / output */}
      <section className="relative flex-1 lg:overflow-hidden">
        <div className="h-full overflow-y-auto px-5 pb-28 pt-6 lg:px-10 lg:pb-10 lg:pt-10">
          {/* Mobile top bar — back button + filename, visible on all views */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-[#6B6F76]
                hover:text-[#F7F6F1] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-xs text-[#6B6F76] font-mono truncate max-w-[160px]">
              {activePhoto.name}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {view === "config" && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <header className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-[#F7F6F1]">
                      Configure your captions
                    </h1>
                    <p className="mt-1 text-sm text-[#6B6F76]">
                      Tune the details, then let CaptionGenius write five for you.
                    </p>
                  </div>
                </header>

                <ConfigForm
                  config={config}
                  setConfig={setConfig}
                  onRedescribe={redescribe}
                  describeStatus={describeStatus}
                  role={role}
                />

                {/* desktop generate button */}
                <button
                  type="button"
                  onClick={generate}
                  className="hidden w-full items-center justify-center gap-2 rounded-full bg-lime py-4 font-heading font-semibold text-[#0A0A0A] transition-transform hover:scale-[1.01] lg:flex"
                >
                  <Sparkles className="h-5 w-5" />
                  {session ? "Generate 5 captions" : "Sign in to generate"}
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </motion.div>
            )}

            {view === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ScrambleLoader />
              </motion.div>
            )}

            {view === "output" && (
              <motion.div
                key="output"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <header className="mb-6 flex items-center justify-between">
                  <h2 className="font-heading text-2xl font-bold text-[#F7F6F1]">
                    Your 5 captions
                  </h2>
                  <button
                    type="button"
                    onClick={backToOptions}
                    className="hidden items-center gap-2 text-sm text-[#6B6F76] transition-colors hover:text-[#F7F6F1] lg:inline-flex"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to options
                  </button>
                </header>

                <div className="flex flex-col gap-3">
                  {results.map((c, i) => (
                    <CaptionResultCard
                      key={i}
                      index={i}
                      caption={c}
                      showHashtags={config.hashtags}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={regenerate}
                    className="inline-flex items-center gap-2 rounded-full border border-coral px-5 py-2.5 text-sm font-medium text-coral transition-colors hover:bg-coral hover:text-[#0A0A0A]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-[#0A0A0A] transition-transform hover:scale-[1.02]"
                  >
                    {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedAll ? "Copied" : "Copy all"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile sticky generate bar */}
        {view === "config" && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1a1a1a] bg-[#0A0A0A]/95 p-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={generate}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-lime py-4 font-heading font-semibold text-[#0A0A0A]"
            >
              <Sparkles className="h-5 w-5" />
              {session ? "Generate 5 captions" : "Sign in to generate"}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
