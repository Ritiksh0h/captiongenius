import { join } from "path";
import { stat, readdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface FolderInfo {
  folderId: string;
  images: string[];
}

export async function GET(req: NextRequest) {
  try {
    const folderId = req.nextUrl.searchParams.get("folderId");

    if (!folderId) {
      return await getAllFoldersWithImages();
    }

    return await getUniqueFolderByIdWithImages(folderId);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}

async function getAllFoldersWithImages() {
  const uploadDir = join(process.cwd(), "public", "/uploads");

  try {
    const folderNames = await readdir(uploadDir);
    const foldersWithImages: FolderInfo[] = [];

    for (const folderName of folderNames) {
      const folderPath = join(uploadDir, folderName);
      const folderStat = await stat(folderPath);

      if (folderStat.isDirectory()) {
        const imageFiles = await readdir(folderPath);
        const images = imageFiles.filter((file) =>
          /\.(png|jpe?g|gif)$/i.test(file)
        );
        if (images.length > 0) {
          foldersWithImages.push({ folderId: folderName, images });
        }
      }
    }

    return NextResponse.json({ foldersWithImages }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving folders with images:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving folders with images." },
      { status: 500 }
    );
  }
}

async function getUniqueFolderByIdWithImages(folderId: string) {
  const uploadDir = join(process.cwd(), "public", "/uploads", folderId);

  try {
    const folderStat = await stat(uploadDir);

    if (folderStat.isDirectory()) {
      const imageFiles = await readdir(uploadDir);
      const images = imageFiles.filter((file) =>
        /\.(png|jpe?g|gif)$/i.test(file)
      );

      return NextResponse.json({ folderId, images }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Folder not found or is not a directory." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error retrieving folder with images:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving folder with images." },
      { status: 500 }
    );
  }
}
