import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults", () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.APP_VERSION).toBe("0.1.0");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("coerces PORT to a number", () => {
    expect(parseEnv({ PORT: "8080" }).PORT).toBe(8080);
  });

  it("accepts valid URLs and rejects malformed ones", () => {
    expect(
      parseEnv({ DATABASE_URL: "postgres://u:p@host:5432/db", REDIS_URL: "redis://localhost:6379" })
        .DATABASE_URL,
    ).toContain("postgres://");
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow();
  });
});
