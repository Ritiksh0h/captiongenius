import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ── Users ─────────────────────────────────────────────────────────────────────
// Table "User" + column names match the Prisma-created SQLite schema exactly.
// DATETIME columns store integer milliseconds — timestamp_ms reads them as Date.
export const users = sqliteTable("User", {
  id:            text("id").primaryKey(),
  name:          text("name"),
  email:         text("email").notNull(),          // unique enforced by existing DB index
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image:         text("image"),
  role:                 text("role").notNull().default("free"),
  captionsUsed:         integer("captionsUsed").notNull().default(0),
  resetDate:            integer("resetDate", { mode: "timestamp_ms" }),
  createdAt:            integer("createdAt", { mode: "timestamp_ms" }),
  // ── Stripe ──────────────────────────────────────────────────────────────────
  stripeCustomerId:     text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
});

// ── NextAuth: accounts ────────────────────────────────────────────────────────
export const accounts = sqliteTable("Account", {
  id:                text("id").primaryKey(),
  userId:            text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:              text("type").notNull(),
  provider:          text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token:     text("refresh_token"),
  access_token:      text("access_token"),
  expires_at:        integer("expires_at"),
  token_type:        text("token_type"),
  scope:             text("scope"),
  id_token:          text("id_token"),
  session_state:     text("session_state"),
});

// ── NextAuth: sessions ────────────────────────────────────────────────────────
export const sessions = sqliteTable("Session", {
  id:           text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull(),    // unique enforced by existing DB index
  userId:       text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// ── NextAuth: verification tokens ─────────────────────────────────────────────
export const verificationTokens = sqliteTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token:      text("token").notNull(),            // unique enforced by existing DB index
    expires:    integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ── Caption generations ────────────────────────────────────────────────────────
export const generations = sqliteTable("Generation", {
  id:         text("id").primaryKey(),
  userId:     text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId:   text("folderId").notNull(),
  imageCount: integer("imageCount").notNull().default(1),
  captions:   text("captions").notNull(),   // JSON string
  formData:   text("formData").notNull(),   // JSON string
  createdAt:  integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

// ── Image description cache ────────────────────────────────────────────────────
export const imageDescriptions = sqliteTable(
  "ImageDescription",
  {
    folderId:    text("folderId").notNull(),
    filename:    text("filename").notNull(),
    description: text("description").notNull(),
    model:       text("model").notNull().default("gemini-2.0-flash"),
    createdAt:   integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.folderId, table.filename] }),
  })
);
