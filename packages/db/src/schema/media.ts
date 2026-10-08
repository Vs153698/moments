import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

export const mediaKindEnum = pgEnum("media_kind", ["photo", "video", "audio"]);

export const mediaStatusEnum = pgEnum("media_status", [
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    momentId: uuid("moment_id").references(() => moments.id, { onDelete: "set null" }),
    kind: mediaKindEnum("kind").notNull(),
    storage: text("storage", { enum: ["r2", "stream"] }).notNull().default("r2"),
    bucket: text("bucket"),
    objectKey: text("object_key"),
    cdnUrl: text("cdn_url"),
    durationMs: integer("duration_ms"),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    checksumSha256: text("checksum_sha256"),
    status: mediaStatusEnum("status").notNull().default("uploaded"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("media_assets_owner_idx").on(t.ownerId),
    index("media_assets_moment_idx").on(t.momentId),
    index("media_assets_status_idx").on(t.status),
  ],
);
