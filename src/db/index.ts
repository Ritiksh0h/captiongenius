import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Resolve relative to project root (process.cwd() at Next.js startup)
const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_URL ?? "./dev.db"
);

const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");   // WAL: better concurrent read performance
sqlite.pragma("synchronous = NORMAL"); // faster writes, safe with WAL
sqlite.pragma("foreign_keys = ON");    // enforce FK constraints at the DB level

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
