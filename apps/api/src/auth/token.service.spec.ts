import { describe, expect, it, vi } from "vitest";
import { parseEnv } from "../config/env";
import type { RedisService } from "../redis/redis.service";
import { FakeAuthRepository } from "./fake-auth.repository";
import { hashRefreshToken, TokenService } from "./token.service";

/** Minimal in-memory ioredis stand-in (get/set PX/del). */
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
}

function makeService(envOverrides: Record<string, string> = {}) {
  const env = parseEnv({
    NODE_ENV: "test",
    AUTH_JWT_SECRET: "test-secret",
    ...envOverrides,
  });
  const repo = new FakeAuthRepository();
  const fake = new FakeRedis();
  const redisService = { client: fake } as unknown as RedisService;
  const service = new TokenService(repo, redisService, env);
  return { service, repo, fake, env };
}

describe("token service (C1.3 / KAN-113)", () => {
  it("issues an access + refresh pair and verifies the access token", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();

    const issued = await service.issueTokens(user, "iPhone 15", "1.2.3.4");
    expect(issued.refreshToken).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(issued.accessTokenExpiresAt).toBeTruthy();

    // only the hash is persisted — the raw refresh token never touches the DB
    const stored = [...repo.sessions.values()].at(0)!;
    expect(stored.refreshTokenHash).toBe(hashRefreshToken(issued.refreshToken));
    expect(JSON.stringify([...repo.sessions.values()])).not.toContain(issued.refreshToken);

    const claims = service.verifyAccessToken(issued.accessToken);
    expect(claims).toEqual({ userId: user.id, sessionId: issued.sessionId });
  });

  it("rotates the refresh token: old token dies, new token works", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();
    const first = await service.issueTokens(user);

    const rotated = await service.refresh(first.refreshToken);
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    const claims = service.verifyAccessToken(rotated.accessToken);
    expect(claims).toEqual({ userId: user.id, sessionId: first.sessionId });

    // rotated session now points at the new hash
    const row = await repo.findSessionWithUserByHash(hashRefreshToken(rotated.refreshToken));
    expect(row?.session.id).toBe(first.sessionId);

    // the old token is now unknown to the DB and flagged as used in Redis
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      response: { code: "REFRESH_REUSE_DETECTED" },
    });
  });

  it("reuse detection revokes the whole session (theft replay)", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();
    const first = await service.issueTokens(user);
    const rotated = await service.refresh(first.refreshToken);

    // attacker replays the already-rotated token -> session revoked
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      response: { code: "REFRESH_REUSE_DETECTED" },
    });
    // even the legitimate latest token is now dead — session is gone
    await expect(service.refresh(rotated.refreshToken)).rejects.toMatchObject({
      response: { code: "TOKEN_INVALID" },
    });
  });

  it("rejects a never-issued refresh token", async () => {
    const { service } = makeService();
    await expect(service.refresh("bogus-refresh-token-value")).rejects.toMatchObject({
      response: { code: "TOKEN_INVALID" },
    });
  });

  it("rejects an expired session and deletes it", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();
    const issued = await service.issueTokens(user);

    const session = [...repo.sessions.values()].at(0)!;
    repo.sessions.set(session.id, { ...session, expiresAt: new Date(Date.now() - 1000).toISOString() });

    await expect(service.refresh(issued.refreshToken)).rejects.toMatchObject({
      response: { code: "TOKEN_EXPIRED" },
    });
    expect(repo.sessions.size).toBe(0);
  });

  it("logout revokes server-side: the refresh token stops working immediately", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();
    const issued = await service.issueTokens(user);

    await expect(service.logout(issued.refreshToken)).resolves.toEqual({ revoked: true });
    expect(repo.sessions.size).toBe(0);
    await expect(service.refresh(issued.refreshToken)).rejects.toMatchObject({
      response: { code: "TOKEN_INVALID" },
    });
    // idempotent: logging out an unknown token is still a success
    await expect(service.logout(issued.refreshToken)).resolves.toEqual({ revoked: true });
  });

  it("rejects suspended and deleted accounts on refresh", async () => {
    const { service, repo } = makeService();

    const suspended = repo.seedUser({ suspendedAt: new Date().toISOString() });
    const s1 = await service.issueTokens(suspended);
    await expect(service.refresh(s1.refreshToken)).rejects.toMatchObject({
      response: { code: "ACCOUNT_SUSPENDED" },
    });

    const deleted = repo.seedUser({ deletedAt: new Date().toISOString() });
    const s2 = await service.issueTokens(deleted);
    await expect(service.refresh(s2.refreshToken)).rejects.toMatchObject({
      response: { code: "ACCOUNT_DELETED" },
    });
  });

  it("expires access tokens after ACCESS_TOKEN_TTL_SECONDS", async () => {
    vi.useFakeTimers();
    try {
      const { service, repo } = makeService({ ACCESS_TOKEN_TTL_SECONDS: "1" });
      const user = repo.seedUser();
      const issued = await service.issueTokens(user);
      expect(() => service.verifyAccessToken(issued.accessToken)).not.toThrow();

      vi.advanceTimersByTime(2000);
      await expect(() => service.verifyAccessToken(issued.accessToken)).toThrowError(/Token expired/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects tampered access tokens", async () => {
    const { service, repo } = makeService();
    const user = repo.seedUser();
    const issued = await service.issueTokens(user);
    await expect(() => service.verifyAccessToken(`${issued.accessToken}x`)).toThrowError(/Invalid token/);
    await expect(() => service.verifyAccessToken("a.b")).toThrowError(/Invalid token/);
  });

  it("AUTH_JWT_SECRET is required in production", () => {
    const env = parseEnv({ NODE_ENV: "production" });
    expect(() => makeServiceWithEnv(env)).toThrowError(/AUTH_JWT_SECRET/);
  });
});

// helper for the production-secret assertion
function makeServiceWithEnv(env: ReturnType<typeof parseEnv>) {
  const repo = new FakeAuthRepository();
  const redisService = { client: null } as unknown as RedisService;
  return new TokenService(repo, redisService, env);
}
