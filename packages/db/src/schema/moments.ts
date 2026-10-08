import { check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories";
import { users } from "./identity";

export const momentTypeEnum = pgEnum("moment_type", [
  "hangout",
  "event",
  "trip",
  "celebration",
  "activity",
]);

export const momentStatusEnum = pgEnum("moment_status", [
  "draft",
  "scheduled",
  "live",
  "paused",
  "ended",
  "cancelled",
]);

export const momentPrivacyEnum = pgEnum("moment_privacy", ["public", "invite_only", "private"]);

export const moments = pgTable(
  "moments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id),
    categoryId: uuid("category_id").references(() => categories.id),
    title: text("title").notNull(),
    description: text("description"),
    type: momentTypeEnum("type").notNull().default("hangout"),
    status: momentStatusEnum("status").notNull().default("draft"),
    privacy: momentPrivacyEnum("privacy").notNull().default("public"),
    /** Approximate location (H3) for discovery — exact location is only shared while live (E08). */
    h3Index: text("h3_index"),
    city: text("city"),
    country: text("country"),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
    maxParticipants: integer("max_participants"),
    coverMediaId: uuid("cover_media_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    check("moments_starts_before_ends", sql`${t.endsAt} IS NULL OR ${t.startsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`),
    index("moments_host_idx").on(t.hostId),
    index("moments_status_idx").on(t.status),
    index("moments_starts_at_idx").on(t.startsAt),
    index("moments_privacy_idx").on(t.privacy),
  ],
);
