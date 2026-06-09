import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { favourites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = (session!.user as any).id as string;

  const favs = await db
    .select()
    .from(favourites)
    .where(eq(favourites.userId, userId))
    .orderBy(desc(favourites.createdAt));

  return NextResponse.json({ favourites: favs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = (session!.user as any).id as string;

  const body = (await req.json()) as {
    captionText: string;
    hashtags?:   string[];
    platform?:   string;
    tone?:       string;
    imageDesc?:  string;
  };

  if (!body.captionText?.trim()) {
    return NextResponse.json({ error: "captionText required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.insert(favourites).values({
    id,
    userId,
    captionText: body.captionText.trim(),
    hashtags:    JSON.stringify(body.hashtags ?? []),
    platform:    body.platform ?? null,
    tone:        body.tone    ?? null,
    imageDesc:   body.imageDesc ?? null,
    createdAt:   new Date(),
  });

  return NextResponse.json({ id, success: true });
}
