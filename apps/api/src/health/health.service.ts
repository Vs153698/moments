import { Inject, Injectable } from "@nestjs/common";
import type { HealthCheckResult } from "@moments/types";
import type { Db } from "@moments/db";
import { createDb } from "@moments/db";
import { sql } from "drizzle-orm";
import type { AppEnv } from "../config/env";
import { APP_ENV } from "../config/env";
import { QueueService } from "../queue/queue.service";
import { RedisService } from "../redis/redis.service";

/** Lazy database handle — null when DATABASE_URL is not configured. */
@Injectable()
export class DatabaseService {
  private handle: Db | null | undefined;

  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {}

  get db(): Db | null {
    if (this.handle === undefined) {
      this.handle = this.env.DATABASE_URL ? createDb(this.env.DATABASE_URL) : null;
    }
    return this.handle;
  }
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(APP_ENV) private readonly env: AppEnv,
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
    private readonly queues: QueueService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const checks: Record<string, "pass" | "fail"> = {};

    checks["database"] = await this.checkDatabase();
    checks["redis"] = (await this.redis.ping()) || !this.redis.client ? "pass" : "fail";
    checks["queue"] = this.queues.enabled ? ((await this.redis.ping()) ? "pass" : "fail") : "pass";

    const allPass = Object.values(checks).every((c) => c === "pass");
    return {
      status: allPass ? "ok" : "degraded",
      version: this.env.APP_VERSION,
      uptimeSeconds: Math.round(process.uptime()),
      checks,
    };
  }

  private async checkDatabase(): Promise<"pass" | "fail"> {
    const db = this.database.db;
    if (!db) return "fail";
    try {
      await db.execute(sql`SELECT 1`);
      return "pass";
    } catch {
      return "fail";
    }
  }
}
