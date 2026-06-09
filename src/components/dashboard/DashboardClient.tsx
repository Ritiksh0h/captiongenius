"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface DashboardUser {
  name:    string;
  email:   string;
  image:   string;
  role:    "free" | "plus" | "pro";
  used:    number;
  limit:   number;
  isAdmin?: boolean;
}

interface Generation {
  id:        string;
  createdAt: Date;
  captions:  string;
  formData:  string;
  folderId?: string;
}

interface Props {
  user:               DashboardUser;
  recentGenerations:  Generation[];
  upgraded?:          boolean;
}

// ── Usage bar ──────────────────────────────────────────────────────────────
function UsageBar({ used, limit, role }: { used: number; limit: number; role: string }) {
  const pct    = Math.min((used / limit) * 100, 100);
  const isNear = pct >= 80;
  const isAt   = used >= limit;
  const dots   = Math.min(limit, 20);

  const barColor =
    isAt   ? "bg-[#FF5A3C]" :
    isNear ? "bg-amber-400"  :
    "bg-lime";

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-[#6B6F76] uppercase tracking-widest font-medium">
            Monthly Usage
          </p>
          <p className="text-2xl font-bold text-white mt-1 font-heading">
            {used}
            <span className="text-[#6B6F76] text-base font-normal"> / {limit}</span>
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
          role === "pro"  ? "bg-lime/10 text-lime" :
          role === "plus" ? "bg-violet-500/10 text-violet-300" :
          "bg-[#1a1a1a] text-[#6B6F76]"
        }`}>
          {role}
        </span>
      </div>

      <div className="flex gap-1 mt-4">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              (i / dots) * limit < used ? barColor : "bg-[#1a1a1a]"
            }`}
          />
        ))}
      </div>

      {isAt ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#FF5A3C]">Limit reached for this month</p>
          <Link href="/#pricing" className="text-xs text-lime hover:underline font-medium">
            Upgrade →
          </Link>
        </div>
      ) : role === "free" ? (
        <p className="text-xs text-[#6B6F76] mt-3">
          {limit - used} generation{limit - used !== 1 ? "s" : ""} left ·{" "}
          <Link href="/#pricing" className="text-lime hover:underline">
            Upgrade for more
          </Link>
        </p>
      ) : null}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
      <p className="text-xs text-[#6B6F76] uppercase tracking-widest font-medium mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-white font-heading">{value}</p>
      {sub && <p className="text-xs text-[#6B6F76] mt-1">{sub}</p>}
    </div>
  );
}

// ── Generation card ────────────────────────────────────────────────────────
function GenerationCard({ gen }: { gen: Generation }) {
  let captionList: string[]                    = [];
  let formPrefs:   Record<string, string | undefined> = {};

  try { captionList = JSON.parse(gen.captions); } catch {}
  try { formPrefs   = JSON.parse(gen.formData);  } catch {}

  const firstCaption = captionList[0] ?? "";
  const preview = firstCaption.length > 110
    ? firstCaption.slice(0, 110) + "…"
    : firstCaption;

  const timeAgo = (d: Date) => {
    const s   = Date.now() - new Date(d).getTime();
    const m   = Math.floor(s / 60_000);
    const h   = Math.floor(m / 60);
    const day = Math.floor(h / 24);
    if (day > 0) return `${day}d ago`;
    if (h > 0)   return `${h}h ago`;
    if (m > 0)   return `${m}m ago`;
    return "just now";
  };

  const copyAll = () => {
    const text = captionList.map((c, i) => `${i + 1}. ${c}`).join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5
      hover:border-lime/20 transition-colors group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {!!formPrefs.tone && (
            <span className="text-[10px] px-2 py-0.5 rounded-full
              bg-lime/10 text-lime font-medium uppercase tracking-wider">
              {String(formPrefs.tone).replace(/[^\w\s]/g, "").trim()}
            </span>
          )}
          {!!formPrefs.platform && (
            <span className="text-[10px] px-2 py-0.5 rounded-full
              bg-[#1a1a1a] text-[#6B6F76] font-medium uppercase tracking-wider">
              {String(formPrefs.platform)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#6B6F76] whitespace-nowrap flex-shrink-0">
          {timeAgo(gen.createdAt)}
        </span>
      </div>

      <p className="text-sm text-[#e5e5e5] leading-relaxed mb-3">
        {preview || "No caption text"}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#6B6F76]">
          {captionList.length} caption{captionList.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={copyAll}
          className="text-[10px] text-[#6B6F76] hover:text-lime
            transition-colors opacity-0 group-hover:opacity-100"
        >
          Copy all
        </button>
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function DashboardClient({ user, recentGenerations, upgraded }: Props) {
  const router                          = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);

  // Show upgrade success toast once (Stripe redirects here with ?upgraded=true)
  useEffect(() => {
    if (upgraded) {
      toast.success(
        `Welcome to ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}! 🎉`,
        { description: "Your plan is now active. Enjoy your new caption limit." }
      );
      // Remove the query param so the toast doesn't fire again on refresh
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [upgraded, user.role]);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res  = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4
        flex items-center justify-between sticky top-0
        bg-[#0A0A0A]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-tight font-heading">
            CAPTIONGENIUS
          </Link>
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2
              rounded-full bg-lime text-ink text-sm font-bold
              hover:scale-[1.02] transition-transform"
          >
            + New caption
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5
                rounded-full text-xs font-semibold border border-[#FF5A3C]/30
                text-[#FF5A3C] hover:bg-[#FF5A3C]/10 transition-colors"
            >
              ⚙ Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name}
              width={32}
              height={32}
              className="rounded-full ring-1 ring-[#1a1a1a]"
            />
          )}
          <span className="text-sm text-[#6B6F76] hidden md:block">
            {user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-[#6B6F76] hover:text-white transition-colors
              border border-[#1a1a1a] hover:border-[#2a2a2a] px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-black text-white font-heading">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-[#6B6F76] mt-1 text-sm">
            Here&apos;s what&apos;s happening with your captions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Used"      value={user.used}  sub={`of ${user.limit} this month`} />
          <StatCard label="Remaining" value={Math.max(0, user.limit - user.used)} sub="generations left" />
          <StatCard
            label="Plan"
            value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            sub={user.role === "free" ? "Upgrade for more" : "Active"}
          />
          <StatCard label="Sessions"  value={recentGenerations.length} sub="recent generations" />
        </div>

        {/* Usage bar */}
        <UsageBar used={user.used} limit={user.limit} role={user.role} />

        {/* Quick action */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6
          flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white font-heading">
              Generate new captions
            </h2>
            <p className="text-sm text-[#6B6F76] mt-0.5">
              Upload a photo and get 5 captions in seconds.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            disabled={user.used >= user.limit}
            className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm
              bg-lime text-[#0A0A0A] hover:bg-lime/90 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Upload a photo →
          </button>
        </div>

        {/* Recent generations */}
        <div>
          <h2 className="text-base font-bold text-white mb-5 font-heading">
            Recent generations
          </h2>

          {recentGenerations.length === 0 ? (
            <div className="bg-[#111] border border-dashed border-[#1a1a1a]
              rounded-2xl p-12 text-center">
              <p className="text-[#6B6F76] text-sm">
                No captions yet. Upload your first photo to get started.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 text-sm text-lime hover:underline"
              >
                Upload a photo →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGenerations.map((gen) => (
                <GenerationCard key={gen.id} gen={gen} />
              ))}
            </div>
          )}
        </div>

        {/* Billing portal — paid users */}
        {(user.role === "plus" || user.role === "pro") && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6
            flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                {user.role === "pro" ? "Pro" : "Plus"} plan — active
              </h2>
              <p className="text-sm text-[#6B6F76] mt-0.5">
                Manage your subscription, update payment method, or cancel.
              </p>
            </div>
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm
                border border-[#2a2a2a] text-white hover:border-[#3a3a3a]
                transition-colors disabled:opacity-50"
            >
              {portalLoading ? "Opening…" : "Manage billing →"}
            </button>
          </div>
        )}

        {/* Upgrade CTA — free users only */}
        {user.role === "free" && (
          <div
            className="rounded-2xl p-6 flex flex-col md:flex-row
              items-start md:items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg,rgba(179,238,110,.05),rgba(255,90,60,.05))",
              border:     "1px solid rgba(179,238,110,.15)",
            }}
          >
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                You&apos;re on the free plan
              </h2>
              <p className="text-sm text-[#6B6F76] mt-0.5">
                Upgrade to Plus for 50 captions/month. No quota worries.
              </p>
            </div>
            <Link
              href="/#pricing"
              className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm
                bg-lime text-[#0A0A0A] hover:bg-lime/90 transition-colors"
            >
              See plans →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
