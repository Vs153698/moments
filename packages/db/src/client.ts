import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const DEFAULT_DATABASE_URL = "postgres://moments:moments@localhost:5432/moments";

export function createDb(url: string = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
