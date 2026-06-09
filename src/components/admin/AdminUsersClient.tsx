"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { users } from "@/db/schema";

type User = typeof users.$inferSelect;

export default function AdminUsersClient({ users: initialUsers }: { users: User[] }) {
  const [data,     setData]     = useState(initialUsers);
  const [search,   setSearch]   = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = data.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed");
      setData((d) => d.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-[#F7F6F1]">
          Users
          <span className="ml-2 text-base font-normal text-[#6B6F76]">({data.length})</span>
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-64 rounded-xl border border-[#1a1a1a] bg-[#111] px-4 py-2
            text-sm text-[#F7F6F1] outline-none placeholder:text-[#6B6F76]
            focus:border-lime/50"
        />
      </div>

      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["User", "Plan", "Used", "Joined", "Change role"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#6B6F76]
                    uppercase tracking-wider font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <Image src={u.image} alt="" width={28} height={28}
                          className="rounded-full ring-1 ring-[#1a1a1a] flex-shrink-0" />
                      ) : (
                        <div className="size-7 rounded-full bg-[#1a1a1a] flex items-center
                          justify-center text-xs text-[#6B6F76] flex-shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[#F7F6F1] font-medium truncate">{u.name || "—"}</p>
                        <p className="text-[10px] text-[#6B6F76] truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-[#6B6F76]">{u.captionsUsed ?? 0}</td>
                  <td className="px-4 py-3 text-[#6B6F76] text-xs whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={updating === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] px-2 py-1.5
                        text-xs text-[#F7F6F1] outline-none focus:border-lime/50
                        disabled:opacity-50 cursor-pointer"
                    >
                      <option value="free">Free</option>
                      <option value="plus">Plus</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-sm text-[#6B6F76]">No users found.</p>
        )}
      </div>
    </div>
  );
}
