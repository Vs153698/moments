import { index, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

export const participantRoleEnum = pgEnum("participant_role", ["host", "co_host", "participant"]);

export const participantStatusEnum = pgEnum("participant_status", [
  "invited",
  "joined",
  "left",
  "removed",
]);

export const momentParticipants = pgTable(
  "moment_participants",
  {
    momentId: uuid("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: participantRoleEnum("role").notNull().default("participant"),
    status: participantStatusEnum("status").notNull().default("joined"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.momentId, t.userId] }),
    index("moment_participants_user_idx").on(t.userId),
  ],
);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
  "revoked",
]);

export const momentInvites = pgTable(
  "moment_invites",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id),
    inviteeId: uuid("invitee_id").references(() => users.id),
    code: text("code").notNull().unique(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("moment_invites_invitee_idx").on(t.inviteeId)],
);
