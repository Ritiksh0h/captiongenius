import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const LIMITS: Record<string, number> = { free: 5, plus: 50, pro: 200 };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, (session!.user as any).id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const role      = user.role || "free";
  const limit     = LIMITS[role] ?? 5;
  const used      = user.captionsUsed ?? 0;

  return NextResponse.json({ used, limit, remaining: Math.max(0, limit - used), role });
}
