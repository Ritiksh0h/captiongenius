import mime from "mime";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("image") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "At least one image is required." },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed. Use JPEG, PNG, GIF, or WebP.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB size limit.` },
          { status: 400 }
        );
      }
    }

    const uniqueFolderName = randomBytes(6).toString("base64url");
    const relativeUploadDir = `/uploads/${uniqueFolderName}`;
    const uploadDir = join(process.cwd(), "public", relativeUploadDir);

    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = mime.getExtension(file.type) || "jpg";
      const filename = `${randomBytes(4).toString("hex")}-${uniqueSuffix}.${ext}`;

      await writeFile(join(uploadDir, filename), buffer);
      uploadedFiles.push({ imageUrl: `${relativeUploadDir}/${filename}`, filename });
    }

    return NextResponse.json({ uploadedFiles, uniqueFolderName }, { status: 200 });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
