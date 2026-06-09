import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { redirect } from "next/navigation";
import { collectHealthMetrics } from "@/lib/health-check";
import AdminHealthClient from "@/components/admin/AdminHealthClient";

export const metadata = { title: "System Health — Admin — CaptionGenius" };

export default async function AdminHealthPage({
  searchParams,
}: {
  searchParams: { resumed?: string; kept_paused?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) redirect("/");

  const report = await collectHealthMetrics();

  return (
    <AdminHealthClient
      report={report}
      resumed={searchParams.resumed === "true"}
      keptPaused={searchParams.kept_paused === "true"}
    />
  );
}
