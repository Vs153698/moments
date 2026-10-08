import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiClientError } from "./client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => mockFetch.mockReset());

describe("ApiClient", () => {
  it("getHealth returns parsed JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ status: "ok", version: "0.1.0", uptimeSeconds: 3, checks: {} }),
    });
    const client = new ApiClient("http://api.test");
    const health = await client.getHealth();
    expect(health.status).toBe("ok");
    expect(mockFetch).toHaveBeenCalledWith("http://api.test/v1/health", {
      method: "GET",
      headers: {},
      body: undefined,
    });
  });

  it("createMoment sends JSON body and idempotency key", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ received: true }),
    });
    const client = new ApiClient("http://api.test");
    await client.createMoment({ title: "Chai" }, "key-1");
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe("key-1");
    expect(JSON.parse(init.body)).toEqual({ title: "Chai" });
  });

  it("maps error responses to ApiClientError", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({ statusCode: 400, code: "VALIDATION_ERROR", message: "bad" }),
    });
    const client = new ApiClient("http://api.test");
    const err = await client.getHealth().catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.body.code).toBe("VALIDATION_ERROR");
  });
});
