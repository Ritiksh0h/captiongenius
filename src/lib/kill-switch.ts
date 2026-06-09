import { db } from "@/db";
import { killSwitch } from "@/db/schema";

// 1-minute in-memory cache — avoids a DB query on every request
let cache: { isActive: boolean; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function isKillSwitchActive(): Promise<boolean> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL) return cache.isActive;

  try {
    const [ks] = await db
      .select({ isActive: killSwitch.isActive })
      .from(killSwitch)
      .limit(1);

    const isActive = ks?.isActive ?? false;
    cache = { isActive, ts: now };
    return isActive;
  } catch {
    return false; // fail open — don't block users if DB is unavailable
  }
}

export function invalidateKillSwitchCache() {
  cache = null;
}
