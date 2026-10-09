import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { APP_ENV, type AppEnv } from "../config/env";
import { RedisService } from "../redis/redis.service";
import type { AuthSessionRow, AuthUserRow } from "./auth.repository";
import { AUTH_REPOSITORY, type AuthRepository } from "./auth.repository";

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  /** Opaque rotating refresh token — presented to POST /v1/auth/refresh and /logout. */
  refreshToken: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const usedKey = (hash: string) => `rt:used:${hash}`;

/**
 * JWT access tokens (15 min) + opaque rotating refresh tokens with reuse
 * detection (C1.3 / KAN-113).
 *
 * - Access token: HMAC-signed "<b64url json>.<hmac>" with { sub, sid, typ }.
 * - Refresh token: 48 random bytes (base64url). Only its SHA-256 hash is stored
 *   in the sessions table, so a DB leak never exposes usable tokens.
 * - Rotation: every /refresh presents a new refresh token and the old hash is
 *   recorded in Redis (`rt:used:<hash>` → sessionId). Presenting a token whose
 *   hash is in that set means it was already rotated — the whole session is
 *   revoked (reuse/theft detection).
 * - Logout deletes the session row — server-side revocation.
 */
@Injectable()
export class TokenService {
  private readonly secret: string;

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly redisService: RedisService,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {
    if (env.AUTH_JWT_SECRET) {
      this.secret = env.AUTH_JWT_SECRET;
    } else if (env.NODE_ENV === "production") {
      throw new Error("AUTH_JWT_SECRET is required in production");
    } else {
      // Ephemeral per-boot secret for dev/test — tokens invalidate on restart.
      this.secret = randomBytes(32).toString("hex");
    }
  }

  signAccessToken(userId: string, sessionId: string): { token: string; expiresAt: string } {
    const expMs = Date.now() + this.env.ACCESS_TOKEN_TTL_SECONDS * 1000;
    const payload = b64url(
      JSON.stringify({ sub: userId, sid: sessionId, typ: "access", exp: expMs }),
    );
    return { token: `${payload}.${hmac(this.secret, payload)}`, expiresAt: new Date(expMs).toISOString() };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) throw new UnauthorizedException({ code: "TOKEN_INVALID", message: "Invalid token" });
    const expected = Buffer.from(hmac(this.secret, payload));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException({ code: "TOKEN_INVALID", message: "Invalid token" });
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub: string;
      sid: string;
      typ: string;
      exp: number;
    };
    if (data.typ !== "access") {
      throw new UnauthorizedException({ code: "TOKEN_INVALID", message: "Not an access token" });
    }
    if (data.exp < Date.now()) {
      throw new UnauthorizedException({ code: "TOKEN_EXPIRED", message: "Token expired" });
    }
    return { userId: data.sub, sessionId: data.sid };
  }

  async issueTokens(
    user: Pick<AuthUserRow, "id">,
    deviceName?: string | null,
    ip?: string | null,
  ): Promise<IssuedTokens> {
    const refreshToken = randomBytes(48).toString("base64url");
    const refreshExpiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    const session = await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceName: deviceName ?? null,
      ip: ip ?? null,
      expiresAt: refreshExpiresAt,
    });
    return this.pair(session, refreshToken, refreshExpiresAt);
  }

  async refresh(refreshToken: string, deviceName?: string | null, ip?: string | null): Promise<IssuedTokens> {
    const hash = hashRefreshToken(refreshToken);
    const row = await this.repo.findSessionWithUserByHash(hash);

    if (!row) {
      // Unknown hash — either garbage or a token that was already rotated.
      const redis = this.redisService.client;
      const ownerId = redis ? await redis.get(usedKey(hash)) : null;
      if (ownerId) {
        // Reuse of a rotated refresh token: revoke the entire session.
        await this.repo.deleteSession(ownerId);
        throw new UnauthorizedException({
          code: "REFRESH_REUSE_DETECTED",
          message: "Refresh token reuse detected — session revoked, sign in again",
        });
      }
      throw new UnauthorizedException({ code: "TOKEN_INVALID", message: "Invalid refresh token" });
    }

    const { session, user } = row;
    this.assertUserCanAuthenticate(user);

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await this.repo.deleteSession(session.id);
      throw new UnauthorizedException({ code: "TOKEN_EXPIRED", message: "Refresh token expired" });
    }

    const nextRefresh = randomBytes(48).toString("base64url");
    const refreshExpiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    await this.repo.rotateSession(session.id, hashRefreshToken(nextRefresh), refreshExpiresAt);

    const redis = this.redisService.client;
    if (redis) {
      // Keep the old hash → session mapping for the remaining refresh lifetime
      // so a replayed old token triggers reuse detection.
      await redis.set(usedKey(hash), session.id, "PX", this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    }

    const rotated: AuthSessionRow = { ...session, deviceName: deviceName ?? session.deviceName, ip: ip ?? session.ip };
    return this.pair(rotated, nextRefresh, refreshExpiresAt);
  }

  async logout(refreshToken: string): Promise<{ revoked: true }> {
    const row = await this.repo.findSessionWithUserByHash(hashRefreshToken(refreshToken));
    if (row) await this.repo.deleteSession(row.session.id);
    // Unknown token: idempotent success — the desired end state already holds.
    return { revoked: true };
  }

  private pair(session: AuthSessionRow, refreshToken: string, refreshExpiresAt: Date): IssuedTokens {
    const access = this.signAccessToken(session.userId, session.id);
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      sessionId: session.id,
    };
  }

  private assertUserCanAuthenticate(user: AuthUserRow): void {
    if (user.suspendedAt) {
      throw new ForbiddenException({ code: "ACCOUNT_SUSPENDED", message: "Account is suspended" });
    }
    if (user.deletedAt) {
      throw new ForbiddenException({ code: "ACCOUNT_DELETED", message: "Account was deleted" });
    }
  }
}

/** Guard helper — re-exported so future auth guards share one implementation. */
export function assertUserCanAuthenticate(user: AuthUserRow): void {
  if (user.suspendedAt) {
    throw new ForbiddenException({ code: "ACCOUNT_SUSPENDED", message: "Account is suspended" });
  }
  if (user.deletedAt) {
    throw new ForbiddenException({ code: "ACCOUNT_DELETED", message: "Account was deleted" });
  }
}
