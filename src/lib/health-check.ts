import { db } from "@/db";
import { users, generations, systemMetrics, killSwitch } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { cloudinary } from "@/lib/cloudinary";

export type HealthMetric = {
  type:      "users" | "storage_mb" | "groq_daily" | "neon_rows";
  label:     string;
  value:     number;
  threshold: number;
  pct:       number;
  status:    "ok" | "warning" | "exceeded";
};

export type HealthReport = {
  metrics:         HealthMetric[];
  killActive:      boolean;
  killReason:      string | null;
  killActivatedAt: Date | null;
  checkedAt:       Date;
};

function getThresholds() {
  return {
    users:      parseInt(process.env.ALERT_THRESHOLD_USERS      || "8000"),
    storage_mb: parseInt(process.env.ALERT_THRESHOLD_STORAGE_MB || "8000"),
    groq_daily: parseInt(process.env.ALERT_THRESHOLD_GROQ_DAILY || "12000"),
    neon_rows:  parseInt(process.env.ALERT_THRESHOLD_NEON_ROWS  || "800000"),
  };
}

function calcStatus(value: number, threshold: number): "ok" | "warning" | "exceeded" {
  const ratio = value / threshold;
  if (ratio >= 1.0)  return "exceeded";
  if (ratio >= 0.85) return "warning";
  return "ok";
}

export async function collectHealthMetrics(): Promise<HealthReport> {
  const thresholds = getThresholds();

  // 1. Total user count
  const [{ totalUsers }] = await db
    .select({ totalUsers: count() })
    .from(users);

  // 2. Cloudinary storage usage (in bytes from usage API)
  let storageMb = 0;
  try {
    const usage = await cloudinary.api.usage();
    storageMb   = Math.round((usage.storage?.usage ?? 0) / (1024 * 1024));
  } catch {
    storageMb = 0;
  }

  // 3. Groq calls today = generation records created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [{ groqToday }] = await db
    .select({ groqToday: count() })
    .from(generations)
    .where(sql`${generations.createdAt} >= ${today}`);

  // 4. Total DB row count across all major tables
  const rowResult = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM "User") +
      (SELECT COUNT(*) FROM "Generation") +
      (SELECT COUNT(*) FROM "Favourite") +
      (SELECT COUNT(*) FROM "ImageDescription") +
      (SELECT COUNT(*) FROM "Account") +
      (SELECT COUNT(*) FROM "Session")
    AS total_rows
  `);
  const totalRows = Number((rowResult.rows?.[0] as any)?.total_rows ?? 0);

  const metrics: HealthMetric[] = [
    {
      type:      "users",
      label:     "Total Users",
      value:     totalUsers,
      threshold: thresholds.users,
      pct:       Math.round((totalUsers / thresholds.users) * 100),
      status:    calcStatus(totalUsers, thresholds.users),
    },
    {
      type:      "storage_mb",
      label:     "Cloudinary Storage",
      value:     storageMb,
      threshold: thresholds.storage_mb,
      pct:       Math.round((storageMb / thresholds.storage_mb) * 100),
      status:    calcStatus(storageMb, thresholds.storage_mb),
    },
    {
      type:      "groq_daily",
      label:     "Groq Calls Today",
      value:     groqToday,
      threshold: thresholds.groq_daily,
      pct:       Math.round((groqToday / thresholds.groq_daily) * 100),
      status:    calcStatus(groqToday, thresholds.groq_daily),
    },
    {
      type:      "neon_rows",
      label:     "DB Row Count",
      value:     totalRows,
      threshold: thresholds.neon_rows,
      pct:       Math.round((totalRows / thresholds.neon_rows) * 100),
      status:    calcStatus(totalRows, thresholds.neon_rows),
    },
  ];

  // Kill switch current state
  const [ks] = await db.select().from(killSwitch).limit(1);

  // Persist snapshot (intentionally fire-and-forget on errors)
  await db.insert(systemMetrics).values(
    metrics.map((m) => ({
      id:         crypto.randomUUID(),
      metricType: m.type,
      value:      m.value,
      threshold:  m.threshold,
      status:     m.status,
    }))
  ).catch(() => {});

  return {
    metrics,
    killActive:      ks?.isActive ?? false,
    killReason:      ks?.reason   ?? null,
    killActivatedAt: ks?.activatedAt ?? null,
    checkedAt:       new Date(),
  };
}
