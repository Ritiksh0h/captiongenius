import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, generations } from "@/db/schema";
import { generateCaptionsWithGroq, parseCaptionResponse } from "@/lib/ai";

const LIMITS: Record<string, number> = { free: 5, plus: 50, pro: 200 };

export async function POST(req: NextRequest) {
  try {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = (session!.user as any).id as string;

    // ── MONTHLY QUOTA ─────────────────────────────────────────────────────────
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role  = user.role || "free";
    const limit = LIMITS[role] ?? 5;

    // Reset monthly counter if new month
    const now       = new Date();
    const resetDate = user.resetDate ? new Date(user.resetDate) : new Date(0);
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      await db.update(users).set({ captionsUsed: 0, resetDate: now }).where(eq(users.id, userId));
      user.captionsUsed = 0;
    }

    if ((user.captionsUsed ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Monthly limit reached. You've used ${user.captionsUsed}/${limit} captions this month.`, limitReached: true },
        { status: 429 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── PARSE REQUEST ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { folderId, imageDescription, language, type, tone, length, hashtag, platform } =
      body as {
        folderId:         string;
        imageDescription: string;
        language?:        string;
        type:             string | string[];
        tone:             string;
        length:           string;
        hashtag?:         boolean;
        platform?:        string;
      };

    if (!folderId) {
      return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── BUILD TEXT-ONLY PROMPT ────────────────────────────────────────────────
    const lengthMap: Record<string, string> = {
      "🚀 Snappy":   "very short (under 15 words)",
      "📝 Standard": "20-40 words",
      "📜 Extended": "60-100 words",
      "🎯 Custom":   "medium length",
      "🎲 Random":   "any length you choose",
    };
    const lengthInstruction = lengthMap[length] ?? "medium length";
    const toneClean         = tone?.replace(/[^\w\s]/gu, "").trim() ?? "Neutral";
    const captionTypesText  = Array.isArray(type)
      ? type.map((t: string) => t.replace(/[^\w\s]/gu, "").trim()).join(", ")
      : String(type ?? "").replace(/[^\w\s]/gu, "").trim();

    const prompt = `You are an expert social media caption writer.

The image shows: "${imageDescription || "an uploaded photo"}"

Generate exactly 5 unique captions with these requirements:
- Caption style(s): ${captionTypesText}
- Tone: ${toneClean}
- Length: ${lengthInstruction}
- Platform: ${platform || "general social media"} (follow that platform's caption conventions)
- Language: ${language || "English"}
${hashtag ? "- Include 5-8 relevant hashtags at the end of each caption" : "- Do NOT include hashtags"}

Rules:
- Each caption must be completely different from the others
- Make them engaging and optimised for social media
- Return ONLY a JSON object with a "captions" key containing an array of 5 strings
- No other keys. No markdown. No explanation.

Example: {"captions": ["Caption one", "Caption two", "Caption three", "Caption four", "Caption five"]}`;
    // ─────────────────────────────────────────────────────────────────────────

    // ── GENERATE WITH GROQ ────────────────────────────────────────────────────
    const responseText = await generateCaptionsWithGroq(prompt);
    const captions     = parseCaptionResponse(responseText);
    if (captions.length === 0) throw new Error("Failed to parse caption response");
    // ─────────────────────────────────────────────────────────────────────────

    // ── PERSIST + INCREMENT USAGE ─────────────────────────────────────────────
    await db.insert(generations).values({
      id:        crypto.randomUUID(),
      userId,
      folderId,
      imageCount: 1,
      captions:  JSON.stringify(captions),
      formData:  JSON.stringify({ imageDescription, language, type, tone, length, hashtag, platform }),
      createdAt: new Date(),
    });

    await db
      .update(users)
      .set({ captionsUsed: sql`${users.captionsUsed} + 1` })
      .where(eq(users.id, userId));
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ captions, usageAfter: (user.captionsUsed ?? 0) + 1, limit });
  } catch (err: unknown) {
    const errObj = err as { rateLimited?: boolean };
    const msg    = String(err);

    if (errObj.rateLimited || msg.includes("rate_limit") || msg.includes("429")) {
      console.warn("[generate-caption] Groq rate-limited");
      return NextResponse.json(
        { error: "Caption generation is temporarily rate-limited. Wait 30 seconds and try again.", rateLimited: true },
        { status: 429 }
      );
    }
    if (msg.includes("GROQ_API_KEY")) {
      return NextResponse.json({ error: "Caption service not configured." }, { status: 500 });
    }

    console.error("[generate-caption] Unhandled error:", err);
    return NextResponse.json({ error: "Failed to generate captions. Please try again." }, { status: 500 });
  }
}
