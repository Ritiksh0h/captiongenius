import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { favourites } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = (session!.user as any).id as string;

  await db
    .delete(favourites)
    .where(
      and(
        eq(favourites.id, params.id),
        eq(favourites.userId, userId) // ownership check
      )
    );

  return NextResponse.json({ success: true });
}
