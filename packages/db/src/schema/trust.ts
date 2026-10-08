import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

export const moderationActionEnum = pgEnum("moderation_action", [
  "warn",
  "mute",
  "suspend",
  "ban",
  "content_removed",
]);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    moderatorId: uuid("moderator_id")
      .notNull()
      .references(() => users.id),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
    momentId: uuid("moment_id").references(() => moments.id, { onDelete: "set null" }),
    action: moderationActionEnum("action").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("moderation_actions_target_idx").on(t.targetUserId, t.createdAt)],
);

export const safetyTargetEnum = pgEnum("safety_target_type", [
  "user",
  "moment",
  "media",
  "comment",
]);

export const safetyFlagEnum = pgEnum("safety_flag", [
  "spam",
  "harassment",
  "nsfw",
  "violence",
  "misinformation",
]);

export const safetyFlagStatusEnum = pgEnum("safety_flag_status", [
  "open",
  "cleared",
  "actioned",
]);

export const safetyFlags = pgTable(
  "safety_flags",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    flaggerId: uuid("flagger_id").references(() => users.id, { onDelete: "set null" }),
    targetType: safetyTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    flag: safetyFlagEnum("flag").notNull(),
    status: safetyFlagStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("safety_flags_target_idx").on(t.targetType, t.targetId)],
);
