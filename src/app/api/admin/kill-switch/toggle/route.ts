import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAILS } from "@/lib/auth";
import { db } from "@/db";
import { killSwitch } from "@/db/schema";
import { invalidateKillSwitchCache } from "@/lib/kill-switch";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!ADMIN_EMAILS.includes(session?.user?.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { active, reason } = (await req.json()) as {
    active:  boolean;
    reason?: string;
  };

  await db
    .insert(killSwitch)
    .values({
      id:          "singleton",
      isActive:    active,
      reason:      reason ?? (active ? "Manually paused by admin" : null),
      activatedAt: active ? new Date() : null,
      approvedAt:  active ? null : new Date(),
      approvedBy:  session?.user?.email,
    })
    .onConflictDoUpdate({
      target: killSwitch.id,
      set: {
        isActive:    active,
        reason:      reason ?? (active ? "Manually paused by admin" : null),
        activatedAt: active ? new Date() : null,
        approvedAt:  active ? null : new Date(),
        approvedBy:  session?.user?.email,
      },
    });

  // Flush the in-memory cache so the new state is picked up immediately
  invalidateKillSwitchCache();

  return NextResponse.json({ success: true, active });
}
