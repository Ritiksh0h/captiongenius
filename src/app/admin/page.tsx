import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, generations } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import Link from "next/link";

export const metadata = { title: "Admin — CaptionGenius" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) redirect("/");

  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);
  const [{ totalGens }]  = await db.select({ totalGens:  count() }).from(generations);

  const planBreakdown = await db
    .select({ role: users.role, count: count() })
    .from(users)
    .groupBy(users.role);

  const recentUsers = await db
    .select({
      id:           users.id,
      name:         users.name,
      email:        users.email,
      role:         users.role,
      captionsUsed: users.captionsUsed,
      createdAt:    users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  const recentGens = await db
    .select({
      id:        generations.id,
      formData:  generations.formData,
      createdAt: generations.createdAt,
      userName:  users.name,
      userEmail: users.email,
    })
    .from(generations)
    .innerJoin(users, eq(generations.userId, users.id))
    .orderBy(desc(generations.createdAt))
    .limit(5);

  const planMap: Record<string, number> = {};
  planBreakdown.forEach((p) => { planMap[p.role] = p.count; });

  const roleBadge = (role: string) => {
    const cls =
      role === "pro"  ? "bg-lime/10 text-lime" :
      role === "plus" ? "bg-violet-500/10 text-violet-300" :
      "bg-[#1a1a1a] text-[#6B6F76]";
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${cls}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#F7F6F1]">Admin Overview</h1>
        <p className="text-[#6B6F76] text-sm mt-1">Signed in as {session?.user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total users",       value: totalUsers },
          { label: "Total generations", value: totalGens },
          { label: "Free users",        value: planMap["free"] ?? 0 },
          { label: "Paid users",        value: (planMap["plus"] ?? 0) + (planMap["pro"] ?? 0) },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
            <p className="text-xs text-[#6B6F76] uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-bold font-display text-[#F7F6F1]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
        <h2 className="font-display text-base font-bold text-[#F7F6F1] mb-4">Plan breakdown</h2>
        <div className="flex gap-8">
          {["free", "plus", "pro"].map((plan) => {
            const n   = planMap[plan] ?? 0;
            const pct = totalUsers ? Math.round((n / totalUsers) * 100) : 0;
            return (
              <div key={plan}>
                <p className="text-xs text-[#6B6F76] uppercase tracking-wider mb-1">{plan}</p>
                <p className="text-xl font-bold font-display text-[#F7F6F1]">
                  {n}
                  <span className="text-sm text-[#6B6F76] font-normal ml-1">({pct}%)</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent users */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-[#F7F6F1]">Recent users</h2>
          <Link href="/admin/users" className="text-xs text-lime hover:underline">View all →</Link>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["User", "Plan", "Used", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#6B6F76] uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#F7F6F1] font-medium">{u.name || "—"}</p>
                    <p className="text-[10px] text-[#6B6F76]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-[#6B6F76]">{u.captionsUsed ?? 0}</td>
                  <td className="px-4 py-3 text-[#6B6F76] text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent generations */}
      <div>
        <h2 className="font-display text-base font-bold text-[#F7F6F1] mb-4">Recent generations</h2>
        <div className="space-y-2">
          {recentGens.map((g) => {
            let fd: Record<string, string> = {};
            try { fd = JSON.parse(g.formData); } catch {}
            return (
              <div key={g.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl
                px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#F7F6F1]">{g.userName || g.userEmail}</p>
                  <p className="text-xs text-[#6B6F76]">
                    {[fd.platform, fd.tone, fd.length].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="text-[10px] text-[#6B6F76] whitespace-nowrap">
                  {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
