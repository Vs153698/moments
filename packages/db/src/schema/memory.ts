import { index, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

/** E16 · AI Memory — per-user distilled memories derived from moments. */
export const aiMemories = pgTable(
  "ai_memories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    entities: jsonb("entities").$type<string[]>().notNull().default([]),
    keywords: text("keywords").array().notNull().default(sql`ARRAY[]::text[]`),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull().default("0.50"),
    sourceMomentId: uuid("source_moment_id").references(() => moments.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("ai_memories_user_idx").on(t.userId, t.createdAt)],
);
