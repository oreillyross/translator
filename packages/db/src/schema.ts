import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Exactly three tables (CLAUDE.md HC-12). The vocabulary is never in here —
 * it lives in YAML, see apps/server/src/vocabulary.
 */

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Only the SHA-256 hash of the token is stored (CLAUDE.md §4.4) — a DB leak
 * yields nothing usable. Single use: the row is deleted on redemption.
 */
export const magicToken = pgTable("magic_token", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type MagicToken = typeof magicToken.$inferSelect;
