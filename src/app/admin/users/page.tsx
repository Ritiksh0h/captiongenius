import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const metadata = { title: "Users — Admin — CaptionGenius" };

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) redirect("/");

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return <AdminUsersClient users={allUsers} />;
}
