import type { Config } from "drizzle-kit";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema:  "./src/db/schema.ts",
  out:     "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(process.cwd(), process.env.DATABASE_URL ?? "./dev.db"),
  },
} satisfies Config;
