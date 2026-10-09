import { generateKeyPairSync, sign as rsaSign } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEnv } from "../config/env";
import type { RedisService } from "../redis/redis.service";
import { FakeAuthRepository } from "./fake-auth.repository";
import { SocialService } from "./social.service";
import { TokenService } from "./token.service";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const APPLE_JWK = { ...publicKey.export({ format: "jwk" }), kid: "test-kid", alg: "RS256", use: "sig" };

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function signAppleToken(claims: Record<string, unknown>, kid = "test-kid"): string {
  const header = b64url(JSON.stringify({ alg: "RS256", kid }));
  const payload = b64url(JSON.stringify(claims));
  const signature = rsaSign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey);
  return `${header}.${payload}.${b64url(signature)}`;
}

const GOOGLE_CLIENT_ID = "google-client-id.apps.googleusercontent.com";
const APPLE_CLIENT_ID = "app.moments.signin";

function makeService(envOverrides: Record<string, string> = {}) {
  const env = parseEnv({
    NODE_ENV: "test",
    AUTH_JWT_SECRET: "test-secret",
    GOOGLE_CLIENT_ID,
    APPLE_CLIENT_ID,
    ...envOverrides,
  });
  const repo = new FakeAuthRepository();
  const redisService = { client: null } as unknown as RedisService;
  const tokens = new TokenService(repo, redisService, env);
  const service = new SocialService(repo, tokens, env);
  return { service, repo, env };
}

function stubFetch(routes: Record<string, () => { status: number; json: unknown }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const base = url.split("?")[0] ?? "";
      const route = routes[base];
      if (!route) return { ok: false, status: 404, json: async () => ({}) } as Response;
      const { status, json } = route();
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => json,
      } as Response;
    }),
  );
}

function googleClaims(overrides: Record<string, string> = {}) {
  return {
    sub: "google-sub-123",
    email: "vaibhav@gmail.com",
    email_verified: "true",
    aud: GOOGLE_CLIENT_ID,
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    name: "Vaibhav Singh",
    picture: "https://lh3.googleusercontent.com/avatar",
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("social service (C1.1 / KAN-111)", () => {
  it("google: new user signs up -> isNewUser=true, account linked, token pair issued", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: googleClaims() }),
    });
    const { service, repo } = makeService();

    const res = await service.google("any-google-id-token");
    expect(res.isNewUser).toBe(true);
    expect(res.user.email).toBe("vaibhav@gmail.com");
    expect(res.user.handle).toMatch(/^vaibhav/);
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toMatch(/^[A-Za-z0-9_-]{64}$/);

    // provider account recorded against the new user
    const linked = await repo.findOAuthAccount("google", "google-sub-123");
    expect(linked?.userId).toBe(res.user.id);
  });

  it("google: returning user with linked account signs in -> isNewUser=false, no duplicate user", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: googleClaims() }),
    });
    const { service, repo } = makeService();

    const first = await service.google("token-1");
    const second = await service.google("token-2");
    expect(second.isNewUser).toBe(false);
    expect(second.user.id).toBe(first.user.id);
    expect(repo.users.size).toBe(1);
  });

  it("account linking by email: same person, Google then Apple -> one account, both providers linked", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: googleClaims() }),
      "https://appleid.apple.com/auth/keys": () => ({ status: 200, json: { keys: [APPLE_JWK] } }),
    });
    const { service, repo } = makeService();

    const viaGoogle = await service.google("token-1");

    const appleToken = signAppleToken({
      sub: "apple-sub-456",
      email: "vaibhav@gmail.com",
      email_verified: "true",
      iss: "https://appleid.apple.com",
      aud: APPLE_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const viaApple = await service.apple(appleToken);

    expect(viaApple.isNewUser).toBe(false);
    expect(viaApple.user.id).toBe(viaGoogle.user.id);
    expect(repo.users.size).toBe(1);
    // both provider accounts point at the single user
    expect((await repo.findOAuthAccount("google", "google-sub-123"))?.userId).toBe(viaGoogle.user.id);
    expect((await repo.findOAuthAccount("apple", "apple-sub-456"))?.userId).toBe(viaGoogle.user.id);
  });

  it("apple: verifies RS256 signature against live JWKS (real keypair), rejects tampered tokens", async () => {
    const { service, repo } = makeService();
    stubFetch({
      "https://appleid.apple.com/auth/keys": () => ({ status: 200, json: { keys: [APPLE_JWK] } }),
    });

    const token = signAppleToken({
      sub: "apple-sub-789",
      iss: "https://appleid.apple.com",
      aud: APPLE_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const res = await service.apple(token);
    expect(res.isNewUser).toBe(true);
    expect(repo.users.size).toBe(1);

    // same claims, different key -> signature must fail
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const badHeader = b64url(JSON.stringify({ alg: "RS256", kid: "test-kid" }));
    const badPayload = b64url(
      JSON.stringify({
        sub: "apple-sub-999",
        iss: "https://appleid.apple.com",
        aud: APPLE_CLIENT_ID,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );
    const badSig = rsaSign("RSA-SHA256", Buffer.from(`${badHeader}.${badPayload}`), other.privateKey);
    await expect(service.apple(`${badHeader}.${badPayload}.${b64url(badSig)}`)).rejects.toMatchObject({
      response: { code: "INVALID_ID_TOKEN" },
    });
  });

  it("rejects expired tokens and audience mismatches", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({
        status: 200,
        json: googleClaims({ exp: String(Math.floor(Date.now() / 1000) - 60) }),
      }),
      "https://appleid.apple.com/auth/keys": () => ({ status: 200, json: { keys: [APPLE_JWK] } }),
    });
    const { service } = makeService();

    await expect(service.google("expired")).rejects.toMatchObject({ response: { code: "INVALID_ID_TOKEN" } });

    const wrongAud = signAppleToken({
      sub: "apple-sub-x",
      iss: "https://appleid.apple.com",
      aud: "some.other.app",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await expect(service.apple(wrongAud)).rejects.toMatchObject({ response: { code: "INVALID_ID_TOKEN" } });
  });

  it("rejects unverified Google emails", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({
        status: 200,
        json: googleClaims({ email_verified: "false" }),
      }),
    });
    const { service, repo } = makeService();
    await expect(service.google("token")).rejects.toMatchObject({ response: { code: "EMAIL_NOT_VERIFIED" } });
    expect(repo.users.size).toBe(0);
  });

  it("under-18 block: recorded DOB under 18 cannot sign in", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: googleClaims() }),
    });
    const { service, repo } = makeService();
    repo.seedUser({
      email: "vaibhav@gmail.com",
      dateOfBirth: new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    });

    await expect(service.google("token")).rejects.toMatchObject({ response: { code: "UNDERAGE_BLOCK" } });
  });

  it("suspended and deleted accounts are rejected on login", async () => {
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: googleClaims() }),
    });
    const { service, repo } = makeService();
    repo.seedUser({ email: "vaibhav@gmail.com", suspendedAt: new Date().toISOString() });
    await expect(service.google("token")).rejects.toMatchObject({ response: { code: "ACCOUNT_SUSPENDED" } });

    const claims = googleClaims({ sub: "google-sub-deleted", email: "deleted@gmail.com" });
    stubFetch({
      "https://oauth2.googleapis.com/tokeninfo": () => ({ status: 200, json: claims }),
    });
    repo.seedUser({ email: "deleted@gmail.com", deletedAt: new Date().toISOString() });
    await expect(service.google("token")).rejects.toMatchObject({ response: { code: "ACCOUNT_DELETED" } });
  });
});
