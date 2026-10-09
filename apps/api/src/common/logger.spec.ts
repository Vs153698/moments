import { describe, expect, it, vi } from "vitest";
import { betterStackDrain, createLogger } from "./logger";

describe("better stack log drain (F8)", () => {
  it("ships each JSON log line to the ingest endpoint", async () => {
    const sent: { url: string; line: string }[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      sent.push({ url: String(input), line: String(init?.body ?? "") });
      return new Response("ok", { status: 202 });
    });

    const logger = createLogger("info", { log: () => {} }, betterStackDrain("token123", fetchImpl));
    logger.error("boom", { reason: "smoke" });

    await vi.waitFor(() => expect(sent.length).toBe(1));
    expect(sent[0]!.url).toBe("https://in.logs.betterstack.com/token123");
    const parsed = JSON.parse(sent[0]!.line);
    expect(parsed.level).toBe("error");
    expect(parsed.msg).toBe("boom");
    expect(parsed.reason).toBe("smoke");
  });

  it("never throws when the ingest endpoint is down", async () => {
    const failing = vi.fn(async () => {
      throw new Error("network down");
    });
    const logger = createLogger("info", { log: () => {} }, betterStackDrain("token123", failing));
    expect(() => logger.error("still alive")).not.toThrow();
  });
});
