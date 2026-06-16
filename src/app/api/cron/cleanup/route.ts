import { NextRequest, NextResponse } from "next/server";
import { listUploadFolders, listCloudinaryFolder, deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/db";
import { imageDescriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const cutoff = new Date(Date.now() - TTL_MS);

  let deletedFolders = 0;
  let deletedFiles   = 0;

  try {
    const folders = await listUploadFolders();

    for (const folderName of folders) {
      const resources = await listCloudinaryFolder(`uploads/${folderName}`);
      if (resources.length === 0) continue;

      const oldest = resources.reduce((a, b) =>
        a.createdAt < b.createdAt ? a : b
      );

      if (oldest.createdAt < cutoff) {
        for (const r of resources) {
          await deleteFromCloudinary(r.publicId);
          deletedFiles++;
        }

        await db
          .delete(imageDescriptions)
          .where(eq(imageDescriptions.folderId, folderName));

        deletedFolders++;
        console.log(`[cleanup] Deleted folder ${folderName} (${resources.length} files)`);
      }
    }

    return NextResponse.json({
      success:        true,
      deletedFolders,
      deletedFiles,
      checkedAt:      new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cleanup] Error:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
