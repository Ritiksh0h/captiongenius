import { NextRequest, NextResponse } from "next/server";
import { listR2Objects, deleteFromR2 } from "@/lib/r2";
import { db } from "@/db";
import { imageDescriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const cutoff = new Date(Date.now() - TTL_MS);

  let deletedFolders = 0;
  let deletedFiles   = 0;

  try {
    const allKeys = await listR2Objects("uploads/");

    // Group keys by folderId
    const folderMap = new Map<string, string[]>();
    for (const key of allKeys) {
      const parts    = key.split("/");  // "uploads/{folderId}/{filename}"
      const folderId = parts[1];
      const filename = parts[2];
      if (!folderId || !filename) continue;

      if (!folderMap.has(folderId)) folderMap.set(folderId, []);
      folderMap.get(folderId)!.push(key);
    }

    // Use the DB description cache timestamp as a proxy for upload time
    for (const [folderId, keys] of folderMap.entries()) {
      const [cached] = await db
        .select({ createdAt: imageDescriptions.createdAt })
        .from(imageDescriptions)
        .where(eq(imageDescriptions.folderId, folderId))
        .limit(1);

      const uploadTime = cached?.createdAt ? new Date(cached.createdAt) : new Date(0);

      if (uploadTime < cutoff) {
        for (const key of keys) {
          await deleteFromR2(key);
          deletedFiles++;
        }
        await db
          .delete(imageDescriptions)
          .where(eq(imageDescriptions.folderId, folderId));

        deletedFolders++;
        console.log(`[cleanup] Deleted folder ${folderId} (${keys.length} files)`);
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
