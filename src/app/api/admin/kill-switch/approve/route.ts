import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { killSwitch } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const action = req.nextUrl.searchParams.get("action") as "approve" | "deny";

  if (secret !== process.env.KILL_SWITCH_SECRET) {
    return new NextResponse("Invalid secret", { status: 401 });
  }
  if (!["approve", "deny"].includes(action)) {
    return new NextResponse("Invalid action", { status: 400 });
  }

  const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (action === "approve") {
    await db
      .update(killSwitch)
      .set({
        isActive:   false,
        approvedAt: new Date(),
        approvedBy: process.env.ADMIN_ALERT_EMAIL,
      })
      .where(eq(killSwitch.id, "singleton"));

    return NextResponse.redirect(`${BASE_URL}/admin/health?resumed=true`, { status: 302 });
  } else {
    return NextResponse.redirect(`${BASE_URL}/admin/health?kept_paused=true`, { status: 302 });
  }
}
