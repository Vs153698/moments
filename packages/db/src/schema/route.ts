import { geometry, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { moments } from "./moments";

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    momentId: uuid("moment_id")
      .notNull()
      .unique()
      .references(() => moments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** GeoJSON LineString of the planned path. */
    pathGeoJson: jsonb("path_geo_json").$type<Record<string, unknown>>(),
    distanceMeters: integer("distance_meters"),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("routes_moment_idx").on(t.momentId)],
);

export const routeCheckpoints = pgTable(
  "route_checkpoints",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    name: text("name").notNull(),
    location: geometry("location", { type: "point", srid: 4326, mode: "tuple" }).notNull(),
    eta: timestamp("eta", { withTimezone: true, mode: "string" }),
  },
  (t) => [index("route_checkpoints_route_idx").on(t.routeId, t.seq)],
);

export const liveLocations = pgTable(
  "live_locations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    momentId: uuid("moment_id")
      .notNull()
      .references(() => moments.id, { onDelete: "cascade" }),
    location: geometry("location", { type: "point", srid: 4326, mode: "tuple" }).notNull(),
    accuracyMeters: integer("accuracy_meters"),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("live_locations_moment_time_idx").on(t.momentId, t.recordedAt),
    index("live_locations_user_idx").on(t.userId),
  ],
);
