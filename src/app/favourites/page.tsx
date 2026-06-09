import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { favourites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CopyButton } from "@/components/history/CopyButton";
import { DeleteFavButton } from "@/components/favourites/DeleteFavButton";

export const metadata = { title: "Favourites — CaptionGenius" };

export default async function FavouritesPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) redirect("/");

  const userId = (session!.user as any).id as string;

  const favs = await db
    .select()
    .from(favourites)
    .where(eq(favourites.userId, userId))
    .orderBy(desc(favourites.createdAt));

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F7F6F1]">
      <header className="border-b border-[#1a1a1a] px-6 py-4
        flex items-center justify-between sticky top-0
        bg-[#0A0A0A]/90 backdrop-blur-sm z-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-lime text-ink">
            <span className="font-display text-sm font-extrabold">C</span>
          </span>
          <span className="font-display font-bold text-[#F7F6F1]">CaptionGenius</span>
        </Link>
        <Link href="/dashboard"
          className="text-sm text-[#6B6F76] hover:text-[#F7F6F1] transition-colors">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#F7F6F1]">Favourites</h1>
          <p className="text-[#6B6F76] text-sm mt-1">
            {favs.length} saved caption{favs.length !== 1 ? "s" : ""}
          </p>
        </div>

        {favs.length === 0 ? (
          <div className="bg-[#111] border border-dashed border-[#1a1a1a]
            rounded-2xl p-16 text-center">
            <p className="text-[#6B6F76] text-sm mb-4">
              No favourites yet. Bookmark captions from the studio.
            </p>
            <Link href="/"
              className="px-6 py-2.5 rounded-full bg-lime text-ink font-semibold
                text-sm hover:scale-[1.03] transition-transform inline-block">
              Generate captions →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favs.map((fav) => {
              let tags: string[] = [];
              try { tags = JSON.parse(fav.hashtags); } catch {}

              return (
                <div key={fav.id}
                  className="group bg-[#111] border border-[#1a1a1a]
                    rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                  {/* Meta row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex gap-2 flex-wrap">
                      {fav.platform && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                          bg-lime/10 text-lime font-medium uppercase tracking-wider">
                          {fav.platform}
                        </span>
                      )}
                      {fav.tone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full
                          bg-[#1a1a1a] text-[#6B6F76] font-medium uppercase tracking-wider">
                          {fav.tone}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B6F76] whitespace-nowrap flex-shrink-0">
                      {fav.createdAt ? new Date(fav.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>

                  {/* Caption text */}
                  <p className="text-[15px] text-[#F7F6F1] leading-relaxed mb-3">
                    {fav.captionText}
                  </p>

                  {/* Hashtags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                      {tags.map((t) => (
                        <span key={t} className="text-sm text-lime">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer: image context + actions */}
                  <div className="flex items-center justify-between gap-3">
                    {fav.imageDesc ? (
                      <p className="text-[11px] text-[#525252] truncate max-w-[60%]">
                        {fav.imageDesc}
                      </p>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <CopyButton
                        text={
                          tags.length > 0
                            ? `${fav.captionText}\n\n${tags.join(" ")}`
                            : fav.captionText
                        }
                      />
                      <DeleteFavButton id={fav.id} />
                    </div>
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
