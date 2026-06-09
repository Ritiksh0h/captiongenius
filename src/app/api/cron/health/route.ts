import { NextRequest, NextResponse } from "next/server";
import { collectHealthMetrics } from "@/lib/health-check";
import { sendCostAlert, type MetricAlert } from "@/lib/email-alerts";
import { db } from "@/db";
import { killSwitch } from "@/db/schema";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const report = await collectHealthMetrics();

    const alertMetrics: MetricAlert[] = report.metrics
      .filter((m) => m.status !== "ok")
      .map((m) => ({
        type:      m.type as MetricAlert["type"],
        value:     m.value,
        threshold: m.threshold,
        status:    m.status as "warning" | "exceeded",
      }));

    const hasExceeded = alertMetrics.some((a) => a.status === "exceeded");

    if (alertMetrics.length > 0) {
      await sendCostAlert(alertMetrics);

      if (hasExceeded) {
        const exceededTypes = alertMetrics
          .filter((a) => a.status === "exceeded")
          .map((a) => a.type)
          .join(", ");

        await db
          .insert(killSwitch)
          .values({
            id:          "singleton",
            isActive:    true,
            reason:      `Auto-paused: ${exceededTypes} exceeded threshold`,
            activatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: killSwitch.id,
            set: {
              isActive:    true,
              reason:      `Auto-paused: ${exceededTypes} exceeded threshold`,
              activatedAt: new Date(),
              approvedAt:  null,
              approvedBy:  null,
            },
          });
      }
    }

    return NextResponse.json({
      success:    true,
      alertsSent: alertMetrics.length,
      killActive: hasExceeded,
      metrics:    report.metrics.map((m) => ({
        type:   m.type,
        value:  m.value,
        status: m.status,
      })),
    });
  } catch (err) {
    console.error("[cron/health] Error:", err);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
