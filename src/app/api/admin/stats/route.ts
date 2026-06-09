import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { db } from "@/db";
import { users, generations } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id:           users.id,
      name:         users.name,
      email:        users.email,
      image:        users.image,
      role:         users.role,
      captionsUsed: users.captionsUsed,
      createdAt:    users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(generations);

  const planCounts = await db
    .select({ role: users.role, total: count() })
    .from(generations)
    .innerJoin(users, eq(generations.userId, users.id))
    .groupBy(users.role);

  const recentGens = await db
    .select({
      id:        generations.id,
      folderId:  generations.folderId,
      formData:  generations.formData,
      createdAt: generations.createdAt,
      userName:  users.name,
      userEmail: users.email,
    })
    .from(generations)
    .innerJoin(users, eq(generations.userId, users.id))
    .orderBy(desc(generations.createdAt))
    .limit(20);

  return NextResponse.json({ users: allUsers, totalGens: total, planCounts, recentGens });
}
