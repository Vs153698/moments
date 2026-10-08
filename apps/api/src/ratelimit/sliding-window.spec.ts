import { describe, expect, it } from "vitest";
import { MemorySlidingWindowStore } from "./sliding-window";

describe("MemorySlidingWindowStore", () => {
  it("allows requests under the limit and rejects beyond it", async () => {
    const store = new MemorySlidingWindowStore();
    const t0 = 1_000_000;
    expect((await store.hit("k", 2, 1_000, t0)).allowed).toBe(true);
    expect((await store.hit("k", 2, 1_000, t0 + 100)).allowed).toBe(true);
    const third = await store.hit("k", 2, 1_000, t0 + 200);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBe(1_000 - 200);
  });

  it("frees capacity as the window slides", async () => {
    const store = new MemorySlidingWindowStore();
    const t0 = 1_000_000;
    await store.hit("k", 1, 1_000, t0);
    expect((await store.hit("k", 1, 1_000, t0 + 999)).allowed).toBe(false);
    expect((await store.hit("k", 1, 1_000, t0 + 1_001)).allowed).toBe(true);
  });

  it("tracks keys independently", async () => {
    const store = new MemorySlidingWindowStore();
    const t0 = 1_000_000;
    await store.hit("a", 1, 1_000, t0);
    expect((await store.hit("b", 1, 1_000, t0)).allowed).toBe(true);
  });
});
