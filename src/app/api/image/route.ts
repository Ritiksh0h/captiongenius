import { NextRequest, NextResponse } from "next/server";
import { listCloudinaryFolder } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
  }

  try {
    const resources = await listCloudinaryFolder(`uploads/${folderId}`);

    const images    = resources.map((r) => {
      const parts = r.publicId.split("/");
      return parts[parts.length - 1];
    });

    const imageUrls = resources.map((r) => r.url);

    return NextResponse.json({ images, imageUrls });
  } catch (err) {
    console.error("[image] Error:", err);
    return NextResponse.json({ error: "Failed to list images." }, { status: 500 });
  }
}
