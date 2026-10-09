import { boolean, date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const createdAt = timestamp("created_at", { withTimezone: true, mode: "string" })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true, mode: "string" })
  .notNull()
  .defaultNow()
  .$onUpdate(() => sql`now()`);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  locale: text("locale").notNull().default("en"),
  isCreator: boolean("is_creator").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  /** ISO date "YYYY-MM-DD". Used for the under-18 sign-in block (C1.1). */
  dateOfBirth: date("date_of_birth"),
  /** Set when an account is suspended — auth endpoints reject suspended users. */
  suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "string" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  createdAt,
  updatedAt,
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  deviceName: text("device_name"),
  ip: text("ip"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt,
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["google", "apple"] }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  createdAt,
});
