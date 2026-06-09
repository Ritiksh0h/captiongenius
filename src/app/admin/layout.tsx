import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) redirect("/");

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F6F1]">
      <header className="border-b border-[#1a1a1a] px-6 py-4
        flex items-center justify-between sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-ink">
              <span className="font-display text-sm font-extrabold">C</span>
            </span>
            <span className="font-display font-bold text-[#F7F6F1]">CaptionGenius</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5A3C]/10
            text-[#FF5A3C] font-semibold uppercase tracking-wider">
            Admin
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[#6B6F76]">
          <Link href="/dashboard" className="hover:text-[#F7F6F1] transition-colors">
            My Dashboard
          </Link>
          <Link href="/admin" className="hover:text-[#F7F6F1] transition-colors">
            Overview
          </Link>
          <Link href="/admin/users" className="hover:text-[#F7F6F1] transition-colors">
            Users
          </Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
