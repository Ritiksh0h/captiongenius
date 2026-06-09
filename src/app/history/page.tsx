import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/history/CopyButton";

export const metadata = { title: "Caption History — CaptionGenius" };

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) redirect("/");

  const userId = (session!.user as any).id as string;

  const gens = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, userId))
    .orderBy(desc(generations.createdAt))
    .limit(20);

  const timeAgo = (d: Date | null) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m    = Math.floor(diff / 60_000);
    const h    = Math.floor(m / 60);
    const day  = Math.floor(h / 24);
    if (day > 0) return `${day}d ago`;
    if (h > 0)   return `${h}h ago`;
    if (m > 0)   return `${m}m ago`;
    return "just now";
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F7F6F1]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 sticky top-0
        bg-[#0A0A0A]/90 backdrop-blur-sm z-10
        flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-lime text-ink">
            <span className="font-display text-sm font-extrabold">C</span>
          </span>
          <span className="font-display font-bold text-[#F7F6F1]">CaptionGenius</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-[#6B6F76] hover:text-[#F7F6F1] transition-colors"
        >
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#F7F6F1]">
            Caption History
          </h1>
          <p className="text-[#6B6F76] text-sm mt-1">
            Your last {gens.length} generation{gens.length !== 1 ? "s" : ""}
          </p>
        </div>

        {gens.length === 0 ? (
          <div className="bg-[#111] border border-dashed border-[#1a1a1a]
            rounded-2xl p-16 text-center">
            <p className="text-[#6B6F76] text-sm mb-4">
              No captions generated yet.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-lime text-ink
                font-semibold text-sm hover:scale-[1.03] transition-transform
                inline-block"
            >
              Upload a photo →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {gens.map((gen) => {
              let caps: string[]                          = [];
              let formData: Record<string, string | undefined> = {};
              try { caps     = JSON.parse(gen.captions); } catch {}
              try { formData = JSON.parse(gen.formData);  } catch {}

              return (
                <div
                  key={gen.id}
                  className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5
                    hover:border-[#2a2a2a] transition-colors"
                >
                  {/* Meta row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex gap-2 flex-wrap">
                      {formData.platform && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                          bg-lime/10 text-lime font-medium uppercase tracking-wider">
                          {formData.platform}
                        </span>
                      )}
                      {formData.tone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                          bg-[#1a1a1a] text-[#6B6F76] font-medium uppercase tracking-wider">
                          {String(formData.tone).replace(/[^\w\s]/g, "").trim()}
                        </span>
                      )}
                      {formData.length && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                          bg-[#1a1a1a] text-[#6B6F76] font-medium uppercase tracking-wider">
                          {String(formData.length).replace(/[^\w\s]/g, "").trim()}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B6F76] whitespace-nowrap flex-shrink-0">
                      {timeAgo(gen.createdAt)}
                    </span>
                  </div>

                  {/* Captions */}
                  <div className="space-y-2">
                    {caps.map((caption, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl
                          bg-[#0d0d0d] border border-[#1a1a1a] group"
                      >
                        <span className="font-mono text-[10px] text-lime
                          mt-0.5 flex-shrink-0 select-none">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm text-[#e5e5e5] leading-relaxed flex-1">
                          {caption}
                        </p>
                        <CopyButton text={caption} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
