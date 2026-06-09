"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  RotateCcw,
  Share2,
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
  const words   = text.split(" ");
  const hashIdx = words.findIndex((w) => w.startsWith("#"));
  if (hashIdx === -1) return { text, hashtags: [] };
  return {
    text:     words.slice(0, hashIdx).join(" ").trim(),
    hashtags: words.slice(hashIdx),
  };
}

type Props = {
  photoUrl: string;
  folderId: string;
  onBack:   () => void;
  photos?:  Photo[];
};

export function CaptionStudio({ photoUrl, folderId, onBack, photos }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const gallery: Photo[] =
    photos && photos.length > 0 ? photos : [{ url: photoUrl, name: "photo.png" }];

  const [activePhoto,    setActivePhoto]    = useState(gallery[0]);
  const [view,           setView]           = useState<View>("config");
  const [results,        setResults]        = useState<GeneratedCaption[]>([]);
  const [batchResults,   setBatchResults]   = useState<GeneratedCaption[][]>([]);
  const [batchIndex,     setBatchIndex]     = useState(0);
  const [isBatch,        setIsBatch]        = useState(false);
  const [favouritedIds,  setFavouritedIds]  = useState<Map<number, string>>(new Map());
  const [copiedAll,      setCopiedAll]      = useState(false);
  const [usage,          setUsage]          = useState<{ used: number; limit: number } | null>(null);
  const [describeStatus, setDescribeStatus] = useState<DescribeStatus>("idle");

  const [config, setConfig] = useState<ConfigState>({
    description: "",
    platform:    "instagram",
    styles:      ["Witty", "Storytelling"],
    tone:        "Playful",
    length:      "standard",
    language:    "",
    hashtags:    true,
  });

  const refreshUsage = useCallback(() => {
    if (!session?.user) return;
    fetch("/api/user/usage")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setUsage({ used: d.used, limit: d.limit }); })
      .catch(() => {});
  }, [session]);

  useEffect(() => { refreshUsage(); }, [refreshUsage]);

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

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, activePhoto.name]);

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

  async function generate() {
    if (!session?.user) { signIn("google"); return; }
    if (config.styles.length === 0) {
      toast.error("Select at least one caption style");
      return;
    }

    setView("loading");

    try {
      const isBatchMode  = gallery.length > 1;
      const descriptions = gallery.map((photo) =>
        photo.url === activePhoto.url ? config.description || "" : ""
      );

      const res = await fetch("/api/generate-caption", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          imageDescription:  config.description,
          imageDescriptions: isBatchMode ? descriptions : undefined,
          platform:          config.platform,
          type:              config.styles,
          tone:              config.tone,
          length:            LENGTH_MAP[config.length] ?? "📝 Standard",
          language:          config.language || "English",
          hashtag:           config.hashtags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.paused) {
          toast.error("CaptionGenius is temporarily paused.", {
            description: "We're managing resource usage. Try again in a few minutes.",
          });
          setView("config");
          return;
        }
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

      if (data.isBatch && data.allCaptions) {
        const parsed = (data.allCaptions as string[][]).map(
          (caps) => caps.map(parseCaptionString)
        );
        setBatchResults(parsed);
        setResults(parsed[0] ?? []);
        setIsBatch(true);
        setBatchIndex(0);
      } else {
        setResults((data.captions as string[]).map(parseCaptionString));
        setIsBatch(false);
        setBatchResults([]);
      }

      setFavouritedIds(new Map());
      setView("output");
      refreshUsage();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setView("config");
    }
  }

  function handleEdit(index: number, newText: string) {
    setResults((prev) =>
      prev.map((cap, i) =>
        i === index ? { ...cap, text: newText, edited: true } : cap
      )
    );
    if (isBatch) {
      setBatchResults((prev) =>
        prev.map((batch, bi) =>
          bi === batchIndex
            ? batch.map((cap, ci) =>
                ci === index ? { ...cap, text: newText, edited: true } : cap
              )
            : batch
        )
      );
    }
  }

  async function handleFavourite(index: number) {
    const caption = results[index];
    if (!caption || !session?.user) return;

    const existingId = favouritedIds.get(index);

    if (existingId) {
      try {
        const res = await fetch(`/api/favourites/${existingId}`, { method: "DELETE" });
        if (res.ok) {
          setFavouritedIds((prev) => {
            const next = new Map(prev);
            next.delete(index);
            return next;
          });
        }
      } catch {
        toast.error("Could not remove favourite");
      }
      return;
    }

    try {
      const res = await fetch("/api/favourites", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captionText: caption.text,
          hashtags:    caption.hashtags,
          platform:    config.platform,
          tone:        config.tone,
          imageDesc:   config.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavouritedIds((prev) => new Map([...prev, [index, data.id as string]]));
        toast.success("Saved to favourites");
      }
    } catch {
      toast.error("Could not save favourite");
    }
  }

  // ── Share handler (Web Share API, clipboard fallback) ───────────────────────
  async function handleShare(index: number) {
    const caption = results[index];
    if (!caption) return;

    const text = config.hashtags && caption.hashtags.length > 0
      ? `${caption.text}\n\n${caption.hashtags.join(" ")}`
      : caption.text;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user cancelled
      }
    }
    // Fallback: copy to clipboard
    await navigator.clipboard?.writeText(text);
    toast.success("Caption copied — ready to paste anywhere");
  }

  async function regenerate() {
    setFavouritedIds(new Map());
    await generate();
  }
  function backToOptions() { setView("config"); }

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
      {/* Usage indicator */}
      {usage && (
        <div className="fixed right-4 top-4 z-50">
          <UsageIndicator used={usage.used} limit={usage.limit} />
        </div>
      )}

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <aside className="flex flex-col bg-[#0d0d0d] border-b border-[#141414]
        lg:w-[42%] lg:border-b-0 lg:border-r lg:min-h-screen">

        <div className="flex flex-1 flex-col p-5 lg:p-8 lg:sticky lg:top-0
          lg:h-screen lg:overflow-hidden">

          {/* Mobile back — only in output view */}
          {view === "output" && (
            <button
              type="button"
              onClick={backToOptions}
              className="mb-4 inline-flex items-center gap-1.5 text-xs
                text-[#525252] hover:text-[#F7F6F1] transition-colors lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to options
            </button>
          )}

          {/* Photo */}
          <div className="relative flex-1 overflow-hidden rounded-2xl
            bg-[#141414] min-h-[240px] lg:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.url || "/placeholder.svg"}
              alt={config.description || "Uploaded photo"}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Bottom bar */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-[#525252]
                hover:text-[#F7F6F1] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <span className="truncate font-mono text-[11px] text-[#3a3a3a]">
              {activePhoto.name}
            </span>
          </div>

          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((p) => (
                <button
                  key={p.url + p.name}
                  type="button"
                  onClick={() => { setActivePhoto(p); setDescribeStatus("idle"); }}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl
                    transition-all ${
                    activePhoto.url === p.url
                      ? "ring-2 ring-lime ring-offset-2 ring-offset-[#0d0d0d]"
                      : "opacity-40 hover:opacity-70"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url || "/placeholder.svg"} alt=""
                    className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <section className="relative flex-1 lg:overflow-hidden">
        <div className="h-full overflow-y-auto px-5 pb-28 pt-7
          lg:px-10 lg:pb-12 lg:pt-10">

          <AnimatePresence mode="wait">
            {view === "config" && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <header className="mb-7">
                  {/* Mobile back */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="mb-5 inline-flex items-center gap-1.5 text-xs
                      text-[#525252] hover:text-[#F7F6F1] transition-colors lg:hidden"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <h1 className="font-heading text-xl font-bold text-[#F7F6F1] leading-tight">
                    Configure your captions
                  </h1>
                  <p className="mt-1 text-[13px] text-[#525252]">
                    Tune the details, then generate five.
                  </p>
                </header>

                <ConfigForm
                  config={config}
                  setConfig={setConfig}
                  onRedescribe={redescribe}
                  describeStatus={describeStatus}
                  role={role}
                />

                {/* Desktop generate button */}
                <button
                  type="button"
                  onClick={generate}
                  className="hidden w-full items-center justify-center gap-2
                    rounded-full bg-lime py-3.5 text-[13px] font-semibold
                    text-[#0A0A0A] transition-all hover:scale-[1.01]
                    hover:shadow-[0_0_24px_rgba(199,240,53,0.3)] lg:flex mt-8"
                >
                  <Sparkles className="h-4 w-4" />
                  {session
                    ? gallery.length > 1
                      ? `Generate for ${gallery.length} photos`
                      : "Generate 5 captions"
                    : "Sign in to generate"}
                  <span aria-hidden="true">→</span>
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
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[#F7F6F1]">
                      Your captions
                    </h2>
                    {isBatch && batchResults.length > 1 && (
                      <p className="text-[11px] text-[#525252] mt-0.5">
                        Photo {batchIndex + 1} of {batchResults.length}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={backToOptions}
                    className="hidden items-center gap-1.5 text-xs text-[#525252]
                      hover:text-[#F7F6F1] transition-colors lg:inline-flex"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to options
                  </button>
                </header>

                {/* Batch tabs */}
                {isBatch && batchResults.length > 1 && (
                  <div className="mb-5 flex gap-2 overflow-x-auto pb-1
                    [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {gallery.map((photo, i) => (
                      <button
                        key={photo.url}
                        type="button"
                        onClick={() => {
                          setBatchIndex(i);
                          setResults(batchResults[i] ?? []);
                          setFavouritedIds(new Map());
                        }}
                        className={`flex shrink-0 items-center gap-2 rounded-full
                          px-3 py-1.5 text-[12px] font-medium transition-all ${
                          batchIndex === i
                            ? "bg-lime text-[#0A0A0A]"
                            : "bg-[#141414] text-[#525252] hover:text-[#F7F6F1]"
                        }`}
                      >
                        <span className="h-4 w-4 overflow-hidden rounded-full flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        </span>
                        Photo {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {results.map((c, i) => (
                    <CaptionResultCard
                      key={i}
                      index={i}
                      caption={c}
                      showHashtags={config.hashtags}
                      onEdit={handleEdit}
                      onFavourite={handleFavourite}
                      isFavourited={favouritedIds.has(i)}
                      onShare={handleShare}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={regenerate}
                    className="inline-flex items-center gap-1.5 rounded-full
                      border border-[#1f1f1f] px-4 py-2 text-[13px] font-medium
                      text-[#525252] hover:border-[#FF5A3C]/50 hover:text-[#FF5A3C]
                      transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="inline-flex items-center gap-1.5 rounded-full
                      bg-[#141414] px-4 py-2 text-[13px] font-medium text-[#F7F6F1]
                      hover:bg-[#1c1c1c] transition-colors"
                  >
                    {copiedAll
                      ? <Check className="h-3.5 w-3.5 text-lime" />
                      : <Copy className="h-3.5 w-3.5" />}
                    {copiedAll ? "Copied" : "Copy all"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const text = results
                        .map((r, i) => {
                          const tags = config.hashtags && r.hashtags.length > 0
                            ? `\n${r.hashtags.join(" ")}`
                            : "";
                          return `${String(i + 1).padStart(2, "0")}. ${r.text}${tags}`;
                        })
                        .join("\n\n");

                      if (typeof navigator !== "undefined" && navigator.share) {
                        try {
                          await navigator.share({ text, title: "My CaptionGenius captions" });
                          return;
                        } catch (err) {
                          if ((err as Error).name === "AbortError") return;
                        }
                      }
                      copyAll(); // fallback
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full
                      bg-[#141414] px-4 py-2 text-[13px] font-medium text-[#F7F6F1]
                      hover:bg-[#1c1c1c] transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile sticky generate bar */}
        {view === "config" && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#141414]
            bg-[#0A0A0A]/95 px-4 pb-6 pt-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={generate}
              className="flex w-full items-center justify-center gap-2
                rounded-full bg-lime py-3.5 text-[13px] font-semibold
                text-[#0A0A0A]"
            >
              <Sparkles className="h-4 w-4" />
              {session
                ? gallery.length > 1
                  ? `Generate for ${gallery.length} photos`
                  : "Generate 5 captions"
                : "Sign in to generate"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
