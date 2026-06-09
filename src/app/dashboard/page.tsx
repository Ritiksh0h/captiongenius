import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, generations } from "@/db/schema";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/DashboardClient";

const LIMITS: Record<string, number> = { free: 5, plus: 50, pro: 200 };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) redirect("/");

  const userId = (session!.user as any).id as string;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/");

  const recentGenerations = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, userId))
    .orderBy(desc(generations.createdAt))
    .limit(6);

  const role  = user.role || "free";
  const limit = LIMITS[role] ?? 5;

  return (
    <DashboardClient
      user={{
        name:  session!.user?.name  ?? "",
        email: session!.user?.email ?? "",
        image: session!.user?.image ?? "",
        role:    role as "free" | "plus" | "pro",
        used:    user.captionsUsed ?? 0,
        limit,
        isAdmin: (session!.user as any)?.isAdmin ?? false,
      }}
      recentGenerations={recentGenerations.map((g) => ({
        id:        g.id,
        createdAt: g.createdAt ?? new Date(),
        captions:  g.captions,
        formData:  g.formData,
        folderId:  g.folderId,
      }))}
      upgraded={searchParams.upgraded === "true"}
    />
  );
}
