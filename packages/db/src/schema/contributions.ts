import { index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

export const contributionTypeEnum = pgEnum("contribution_type", ["photo", "video", "text", "poll"]);

export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    type: contributionTypeEnum("type").notNull(),
    body: text("body"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contributions_moment_idx").on(t.momentId),
    index("contributions_author_idx").on(t.authorId),
  ],
);

export const reactionKindEnum = pgEnum("reaction_kind", ["like", "love", "laugh", "wow", "sad"]);

export const reactions = pgTable(
  "reactions",
  {
    contributionId: uuid("contribution_id")
      .notNull()
      .references(() => contributions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: reactionKindEnum("kind").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.contributionId, t.userId, t.kind] })],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    contributionId: uuid("contribution_id").references(() => contributions.id, {
      onDelete: "cascade",
    }),
    momentId: uuid("moment_id").references(() => moments.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("comments_contribution_idx").on(t.contributionId),
    index("comments_moment_idx").on(t.momentId),
    index("comments_parent_idx").on(t.parentId),
  ],
);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    contributionId: uuid("contribution_id")
      .notNull()
      .unique()
      .references(() => contributions.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("polls_ends_at_idx").on(t.endsAt)],
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.pollId, t.userId] })],
);
