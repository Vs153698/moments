import { describe, expect, it } from "vitest";
import type { AppEnv } from "../config/env";
import { HealthController } from "./health.controller";
import type { DatabaseService } from "./health.service";
import { HealthService } from "./health.service";

const env = { APP_VERSION: "test-1" } as AppEnv;

function makeController(opts: {
  dbOk: boolean;
  dbConfigured: boolean;
  redisOk: boolean;
  redisConfigured: boolean;
}): HealthController {
  const database = {
    get db() {
      return opts.dbConfigured
        ? { execute: async () => (opts.dbOk ? [{}] : Promise.reject(new Error("down"))) }
        : null;
    },
  } as unknown as DatabaseService;
  const redis = {
    client: opts.redisConfigured ? ({} as never) : null,
    ping: async () => opts.redisOk,
  };
  const queues = { enabled: opts.redisConfigured };
  const service = new HealthService(env, database, redis as never, queues as never);
  return new HealthController(service);
}

describe("GET /v1/health", () => {
  it("reports ok when all checks pass", async () => {
    const controller = makeController({
      dbOk: true,
      dbConfigured: true,
      redisOk: true,
      redisConfigured: true,
    });
    const result = await controller.check();
    expect(result.status).toBe("ok");
    expect(result.version).toBe("test-1");
    expect(result.checks).toEqual({ database: "pass", redis: "pass", queue: "pass" });
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("reports degraded when the database is down", async () => {
    const controller = makeController({
      dbOk: false,
      dbConfigured: true,
      redisOk: true,
      redisConfigured: true,
    });
    const result = await controller.check();
    expect(result.status).toBe("degraded");
    expect(result.checks["database"]).toBe("fail");
  });

  it("reports degraded when redis is configured but unreachable", async () => {
    const controller = makeController({
      dbOk: true,
      dbConfigured: true,
      redisOk: false,
      redisConfigured: true,
    });
    const result = await controller.check();
    expect(result.checks["redis"]).toBe("fail");
    expect(result.status).toBe("degraded");
  });
});
