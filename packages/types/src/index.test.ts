import { describe, expect, it } from "vitest";
import type { HealthCheckResult, MomentPrivacy } from "./index";

describe("shared types", () => {
  it("HealthCheckResult accepts an ok payload", () => {
    const result: HealthCheckResult = {
      status: "ok",
      version: "0.0.0",
      uptimeSeconds: 12,
      checks: { database: "pass" },
    };
    expect(result.status).toBe("ok");
  });

  it("MomentPrivacy covers the spec values", () => {
    const levels: MomentPrivacy[] = ["public", "invite_only", "private"];
    expect(levels).toHaveLength(3);
  });
});
