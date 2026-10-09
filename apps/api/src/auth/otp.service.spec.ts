import { describe, expect, it } from "vitest";
import { OtpService } from "./otp.service";
import { parseEnv } from "../config/env";
import type { RedisService } from "../redis/redis.service";

/** Minimal in-memory ioredis stand-in (get/set PX/del/incr/expire). */
class FakeRedis {
  private store = new Map<string, { value: string; exp: number | null }>();

  private live(key: string) {
    const entry = this.store.get(key);
    if (entry && entry.exp !== null && entry.exp < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string) {
    return this.live(key)?.value ?? null;
  }

  async set(key: string, value: string, _px: "PX", ttlMs: number) {
    this.store.set(key, { value, exp: Date.now() + ttlMs });
    return "OK";
  }

  async del(...keys: string[]) {
    let n = 0;
    for (const k of keys) if (this.store.delete(k)) n += 1;
    return n;
  }

  async incr(key: string) {
    const entry = this.live(key);
    const next = entry ? Number.parseInt(entry.value, 10) + 1 : 1;
    this.store.set(key, { value: String(next), exp: entry?.exp ?? null });
    return next;
  }

  async expire(key: string, _seconds: number) {
    const entry = this.live(key);
    if (!entry) return 0;
    this.store.set(key, { ...entry, exp: Date.now() + 3600_000 });
    return 1;
  }
}

function makeService(envOverrides: Record<string, string> = {}) {
  const env = parseEnv({ NODE_ENV: "test", OTP_JWT_SECRET: "test-secret", ...envOverrides });
  const fake = new FakeRedis();
  const redisService = { client: fake } as unknown as RedisService;
  const service = new OtpService(redisService, env);
  return { service, fake, env };
}

const PHONE = "+919876543210";

describe("otp service (C1.2 / KAN-112)", () => {
  it("roundtrip: request shows devOtp on screen (dev mode), verify issues a valid token", async () => {
    const { service } = makeService();
    const req = await service.requestOtp(PHONE);
    expect(req.channel).toBe("dev_screen");
    expect(req.devOtp).toMatch(/^\d{6}$/);
    expect(req.expiresInSeconds).toBe(300);

    const res = await service.verifyOtp(PHONE, req.devOtp!);
    expect(res.phone).toBe(PHONE);
    expect(service.verifyToken(res.token).phone).toBe(PHONE);
  });

  it("rejects a wrong OTP and counts attempts down from the limit", async () => {
    const { service } = makeService();
    const req = await service.requestOtp(PHONE);
    const wrong = req.devOtp === "000000" ? "111111" : "000000";

    for (let i = 1; i <= 4; i++) {
      await expect(service.verifyOtp(PHONE, wrong)).rejects.toMatchObject({
        response: { code: "OTP_WRONG" },
      });
    }
    // 5th wrong attempt locks and deletes the record
    await expect(service.verifyOtp(PHONE, wrong)).rejects.toMatchObject({
      response: { code: "OTP_LOCKED" },
    });
    // record is gone — even the right code now fails
    await expect(service.verifyOtp(PHONE, req.devOtp!)).rejects.toMatchObject({
      response: { code: "OTP_INVALID" },
    });
  });

  it("rejects an expired OTP", async () => {
    const { service, fake } = makeService({ OTP_TTL_SECONDS: "1" });
    await service.requestOtp(PHONE);
    const raw = JSON.parse((await fake.get(`otp:${PHONE}`))!);
    raw.exp = Date.now() - 1000; // backdate
    await fake.set(`otp:${PHONE}`, JSON.stringify(raw), "PX", 60_000);

    await expect(service.verifyOtp(PHONE, "123456")).rejects.toMatchObject({
      response: { code: "OTP_EXPIRED" },
    });
  });

  it("enforces the 5-per-hour per-phone request limit", async () => {
    const { service } = makeService();
    for (let i = 0; i < 5; i++) await service.requestOtp(PHONE);
    await expect(service.requestOtp(PHONE)).rejects.toMatchObject({
      response: { code: "OTP_RATE_LIMITED" },
    });
  });

  it("does NOT leak devOtp in production and fails closed without MSG91 config", async () => {
    const { service } = makeService({ NODE_ENV: "production" });
    await expect(service.requestOtp(PHONE)).rejects.toMatchObject({
      response: { code: "MSG91_NOT_CONFIGURED" },
    });
  });

  it("honours DEV_OTP_ON_SCREEN=false override in non-production", async () => {
    const { service } = makeService({ DEV_OTP_ON_SCREEN: "false" });
    await expect(service.requestOtp(PHONE)).rejects.toMatchObject({
      response: { code: "MSG91_NOT_CONFIGURED" },
    });
  });

  it("rejects tampered or expired session tokens", async () => {
    const { service } = makeService();
    const token = service.signToken(PHONE, Date.now() + 60_000);
    expect(service.verifyToken(token).phone).toBe(PHONE);
    await expect(() => service.verifyToken(`${token}x`)).toThrowError(/Invalid token/);
    await expect(() => service.verifyToken(service.signToken(PHONE, Date.now() - 1000))).toThrowError(
      /Token expired/,
    );
  });

  it("fails fast when Redis is not configured", async () => {
    const env = parseEnv({ NODE_ENV: "test", OTP_JWT_SECRET: "s" });
    const service = new OtpService({ client: null } as unknown as RedisService, env);
    await expect(service.requestOtp(PHONE)).rejects.toMatchObject({
      response: { code: "REDIS_UNAVAILABLE" },
    });
  });
});
