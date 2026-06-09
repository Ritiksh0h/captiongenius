import { NextRequest, NextResponse } from "next/server";
import { listR2Objects } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
  }

  try {
    const keys = await listR2Objects(`uploads/${folderId}/`);

    // filenames only — backward-compatible with existing consumers
    const images    = keys.map((k) => k.split("/").pop()!).filter(Boolean);
    // full R2 public URLs for display in the studio
    const imageUrls = keys.map((k) => `${process.env.R2_PUBLIC_URL}/${k}`);

    return NextResponse.json({ images, imageUrls });
  } catch (err) {
    console.error("[image] Error:", err);
    return NextResponse.json({ error: "Failed to list images." }, { status: 500 });
  }
}
