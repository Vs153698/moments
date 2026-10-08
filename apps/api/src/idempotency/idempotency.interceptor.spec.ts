import { lastValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { IdempotencyInterceptor } from "./idempotency.interceptor";

function makeContext(key?: string) {
  const res = {
    statusCode: 201,
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
  const req = { method: "POST", baseUrl: "/v1", path: "/moments", headers: key ? { "idempotency-key": key } : {} };
  const context = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as never;
  return { context, res };
}

describe("IdempotencyInterceptor", () => {
  it("replays the stored response on retry", async () => {
    const interceptor = new IdempotencyInterceptor({ client: null } as never);
    const { context } = makeContext("key-1");

    const first = await lastValueFrom(await interceptor.intercept(context, { handle: () => of({ ok: 1 }) }));
    expect(first).toEqual({ ok: 1 });

    const replay = await lastValueFrom(
      await interceptor.intercept(context, { handle: () => of({ ok: 2 }) }),
    );
    expect(replay).toEqual({ ok: 1 }); // cached, handler not re-executed
  });

  it("ignores requests without an Idempotency-Key header", async () => {
    const interceptor = new IdempotencyInterceptor({ client: null } as never);
    const { context } = makeContext(undefined);
    const out = await lastValueFrom(await interceptor.intercept(context, { handle: () => of({ a: 1 }) }));
    expect(out).toEqual({ a: 1 });
  });
});
