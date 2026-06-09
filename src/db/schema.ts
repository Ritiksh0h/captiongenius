import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("User", {
  id:                   text("id").primaryKey(),
  name:                 text("name"),
  email:                text("email").notNull().unique(),
  emailVerified:        timestamp("emailVerified"),
  image:                text("image"),
  role:                 text("role").notNull().default("free"),
  captionsUsed:         integer("captionsUsed").notNull().default(0),
  resetDate:            timestamp("resetDate"),
  createdAt:            timestamp("createdAt").defaultNow(),
  stripeCustomerId:     text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
});

// ── NextAuth: accounts ────────────────────────────────────────────────────────
export const accounts = pgTable("Account", {
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
export const sessions = pgTable("Session", {
  id:           text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId:       text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      timestamp("expires").notNull(),
});

// ── NextAuth: verification tokens ─────────────────────────────────────────────
export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token:      text("token").notNull().unique(),
    expires:    timestamp("expires").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ── Caption generations ────────────────────────────────────────────────────────
export const generations = pgTable("Generation", {
  id:         text("id").primaryKey(),
  userId:     text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId:   text("folderId").notNull(),
  imageCount: integer("imageCount").notNull().default(1),
  captions:   text("captions").notNull(),   // JSON string
  formData:   text("formData").notNull(),   // JSON string
  createdAt:  timestamp("createdAt").defaultNow().notNull(),
});

// ── Image description cache ────────────────────────────────────────────────────
export const imageDescriptions = pgTable(
  "ImageDescription",
  {
    folderId:    text("folderId").notNull(),
    filename:    text("filename").notNull(),
    description: text("description").notNull(),
    model:       text("model").notNull().default("groq-vision"),
    createdAt:   timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.folderId, table.filename] }),
  })
);

// ── Favourites ────────────────────────────────────────────────────────────────
export const favourites = pgTable("Favourite", {
  id:          text("id").primaryKey(),
  userId:      text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  captionText: text("captionText").notNull(),
  hashtags:    text("hashtags").notNull().default("[]"),
  platform:    text("platform"),
  tone:        text("tone"),
  imageDesc:   text("imageDesc"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

// ── System metrics snapshots ───────────────────────────────────────────────────
export const systemMetrics = pgTable("SystemMetric", {
  id:          text("id").primaryKey(),
  metricType:  text("metricType").notNull(),  // "users" | "storage_mb" | "groq_daily" | "neon_rows"
  value:       integer("value").notNull(),
  threshold:   integer("threshold").notNull(),
  status:      text("status").notNull(),      // "ok" | "warning" | "exceeded"
  recordedAt:  timestamp("recordedAt").defaultNow().notNull(),
});

// ── Kill switch — operational pause control (singleton row, id="singleton") ────
export const killSwitch = pgTable("KillSwitch", {
  id:          text("id").primaryKey().default("singleton"),
  isActive:    boolean("isActive").notNull().default(false),
  reason:      text("reason"),
  activatedAt: timestamp("activatedAt"),
  approvedAt:  timestamp("approvedAt"),
  approvedBy:  text("approvedBy"),
});
