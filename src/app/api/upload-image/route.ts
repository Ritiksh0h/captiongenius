import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { isKillSwitchActive } from "@/lib/kill-switch";
import { randomBytes } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    if (await isKillSwitchActive()) {
      return NextResponse.json(
        { error: "Uploads are temporarily paused. Please try again later.", paused: true },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const files    = formData.getAll("image") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed. Use JPEG, PNG, GIF, or WebP.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `"${file.name}" exceeds the 10MB limit.` },
          { status: 400 }
        );
      }
    }

    const folderId    = randomBytes(6).toString("base64url");
    const uploadedFiles: { imageUrl: string; filename: string; publicId: string }[] = [];

    for (const file of files) {
      const ext      = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const filename = `${randomBytes(4).toString("hex")}-${Date.now()}.${ext}`;
      const buffer   = Buffer.from(await file.arrayBuffer());

      const { url, publicId } = await uploadToCloudinary({
        buffer,
        folder:      `uploads/${folderId}`,
        filename,
        contentType: file.type,
      });

      uploadedFiles.push({ imageUrl: url, filename, publicId });
    }

    return NextResponse.json({ uploadedFiles, uniqueFolderName: folderId }, { status: 200 });
  } catch (err) {
    console.error("[upload-image] Error:", err);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
