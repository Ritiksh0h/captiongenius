import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { imageDescriptions } from "@/db/schema";
import { describeImage } from "@/lib/ai";
import { cloudinary } from "@/lib/cloudinary";

const MODEL = "groq-vision";

export async function POST(req: NextRequest) {
  try {
    const { folderId, imageFileName } = await req.json();

    if (!folderId || !imageFileName) {
      return NextResponse.json(
        { error: "Missing folderId or imageFileName" },
        { status: 400 }
      );
    }

    const bareFilename = String(imageFileName).split("/").pop() || imageFileName;

    // ── CACHE CHECK ───────────────────────────────────────────────────────────
    const [cached] = await db
      .select({ description: imageDescriptions.description, model: imageDescriptions.model })
      .from(imageDescriptions)
      .where(
        and(
          eq(imageDescriptions.folderId, folderId),
          eq(imageDescriptions.filename, bareFilename)
        )
      )
      .limit(1);

    if (cached) {
      console.log(`[describe-image] cache hit: ${folderId}/${bareFilename} (${cached.model})`);
      return NextResponse.json({ description: cached.description, cached: true, model: cached.model });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── FETCH FROM CLOUDINARY ─────────────────────────────────────────────────
    let base64: string;
    let mimeType: string;

    try {
      let fetchUrl: string;
      if (imageFileName.startsWith("http")) {
        fetchUrl = imageFileName;
      } else {
        fetchUrl = cloudinary.url(
          `captiongenius/uploads/${folderId}/${bareFilename}`,
          { resource_type: "image" }
        );
      }
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      base64   = Buffer.from(await res.arrayBuffer()).toString("base64");
    } catch {
      return NextResponse.json(
        { error: `Image not found: ${folderId}/${bareFilename}` },
        { status: 404 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── DESCRIBE WITH GROQ VISION ─────────────────────────────────────────────
    let description: string;
    try {
      description = await describeImage({ base64, mimeType });
    } catch (err: unknown) {
      const errObj = err as { quotaExhausted?: boolean };
      const msg    = String(err);

      if (errObj.quotaExhausted || msg.includes("429") || msg.includes("quota")) {
        console.warn("[describe-image] All vision services unavailable");
        return NextResponse.json(
          {
            error: "Image description temporarily unavailable. Type a description manually.",
            quotaExhausted: true,
            description: "",
          },
          { status: 429 }
        );
      }
      throw err;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── SAVE TO CACHE ─────────────────────────────────────────────────────────
    await db
      .insert(imageDescriptions)
      .values({ folderId, filename: bareFilename, description, model: MODEL })
      .onConflictDoNothing();
    // ─────────────────────────────────────────────────────────────────────────

    console.log(`[describe-image] generated + cached: ${folderId}/${bareFilename}`);
    return NextResponse.json({ description, cached: false, model: MODEL });
  } catch (error) {
    console.error("[describe-image] Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to describe image. Please try again." },
      { status: 500 }
    );
  }
}
