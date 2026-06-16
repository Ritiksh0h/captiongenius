import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not set");
  } else {
    console.error(
      "\n[db] ⚠️  DATABASE_URL is not set.\n" +
      "    Add it to .env → get your Neon connection string at neon.tech\n"
    );
  }
}

const sql = neon(process.env.DATABASE_URL || "postgresql://localhost/dev");
export const db = drizzle(sql, { schema });
export type DB = typeof db;
