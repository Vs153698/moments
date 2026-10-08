import { bigint, check, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

export const wallets = pgTable("wallets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", ["credit", "debit"]);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.userId, { onDelete: "cascade" }),
    type: ledgerEntryTypeEnum("type").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    reason: text("reason").notNull(),
    referenceId: text("reference_id"),
    /** Idempotency key — unique so retries never double-post. */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("ledger_entries_amount_positive", sql`${t.amountCents} > 0`),
    index("ledger_entries_wallet_idx").on(t.walletId, t.createdAt),
  ],
);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
]);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    status: payoutStatusEnum("status").notNull().default("pending"),
    provider: text("provider"),
    providerRef: text("provider_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("payouts_amount_positive", sql`${t.amountCents} > 0`),
    index("payouts_user_idx").on(t.userId, t.createdAt),
  ],
);
