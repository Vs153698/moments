import { describe, expect, it } from "vitest";
import { applyOptimisticMoment, healthQueryOptions, momentKeys } from "./hooks";
import type { ApiClient } from "./client";

describe("query hooks helpers", () => {
  it("healthQueryOptions uses the health key and client fn", async () => {
    const client = { getHealth: async () => ({ status: "ok" as const }) } as unknown as ApiClient;
    const options = healthQueryOptions(client);
    expect(options.queryKey).toEqual(momentKeys.health);
    expect(await options.queryFn()).toEqual({ status: "ok" });
  });

  it("applyOptimisticMoment prepends to list or starts a new one", () => {
    const optimistic = { moment: { title: "x" }, receivedAt: "", optimistic: true as const };
    expect(applyOptimisticMoment(undefined, optimistic)).toHaveLength(1);
    const existing = [{ moment: { title: "old" }, receivedAt: "", optimistic: true as const }];
    const next = applyOptimisticMoment(existing, optimistic);
    expect(next).toHaveLength(2);
    expect(next[0]).toEqual(optimistic);
  });
});
