import { afterEach, describe, expect, it, vi } from "vitest";
import { gunzipSync } from "node:zlib";
import { initPostHog, captureEvent, shutdownPostHog, isPostHogEnabled } from "./posthog";
import { parseEnv } from "../config/env";

function envWith(overrides: Record<string, string>) {
  return parseEnv({ NODE_ENV: "test", ...overrides });
}

function maybeGunzip(body: unknown): string {
  const buf = Buffer.from(body as Uint8Array);
  return buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b
    ? gunzipSync(buf).toString("utf8")
    : buf.toString("utf8");
}

describe("posthog wiring (F8)", () => {
  afterEach(async () => {
    await shutdownPostHog();
    vi.unstubAllGlobals();
  });

  it("is disabled when POSTHOG_KEY is unset", () => {
    initPostHog(envWith({}));
    expect(isPostHogEnabled()).toBe(false);
    // captureEvent must not throw when disabled
    expect(() => captureEvent("u", "event")).not.toThrow();
  });

  it("sends capture calls to the configured host", async () => {
    const fetches: { url: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        fetches.push({ url: String(input), body: init?.body });
        return new Response("{}", { status: 200 });
      }),
    );

    initPostHog(envWith({ POSTHOG_KEY: "phc_testkey" }));
    expect(isPostHogEnabled()).toBe(true);

    captureEvent("user-1", "moment_created", { environment: "test", count: 1 });
    await shutdownPostHog();

    const batch = fetches.find((f) => f.url.includes("/batch"));
    expect(batch).toBeDefined();
    expect(batch!.url).toContain("https://us.i.posthog.com");
    const payload = maybeGunzip(batch!.body);
    expect(payload).toContain("moment_created");
    expect(payload).toContain("user-1");
  });
});
