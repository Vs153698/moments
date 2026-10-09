import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createPublicKey, verify as rsaVerify, randomBytes } from "node:crypto";
import { APP_ENV, type AppEnv } from "../config/env";
import { AUTH_REPOSITORY, type AuthRepository, type AuthUserRow, type SocialProvider } from "./auth.repository";
import { assertUserCanAuthenticate, TokenService } from "./token.service";

export interface SocialProfile {
  provider: SocialProvider;
  /** Stable provider subject ("sub" claim). */
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

export interface SocialLoginResult {
  user: Pick<AuthUserRow, "id" | "handle" | "displayName" | "email" | "avatarUrl">;
  isNewUser: boolean;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";

/** Claims returned by Google's tokeninfo endpoint (all values arrive as strings). */
interface GoogleTokenInfoClaims {
  sub?: string;
  email?: string;
  email_verified?: string;
  aud?: string;
  exp?: string;
  name?: string;
  picture?: string;
}

/** Verified Apple identity-token claims. */
interface AppleIdTokenClaims {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  iss?: string;
  aud?: string;
  exp?: number;
}

interface AppleJwk {
  kid?: string;
  alg?: string;
  n?: string;
  e?: string;
  [key: string]: unknown;
}

function b64urlToBuffer(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** Full years between a YYYY-MM-DD date of birth and now. */
export function ageFromDateOfBirth(dateOfBirth: string, now = new Date()): number {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

function slugHandle(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);
  return slug.length >= 3 ? slug : `user${randomBytes(4).toString("hex")}`;
}

/**
 * Google / Apple sign-in (C1.1 / KAN-111).
 *
 * - Google: ID token verified against Google's tokeninfo endpoint; audience must
 *   match GOOGLE_CLIENT_ID and the email must be verified by Google.
 * - Apple: ID token signature verified against Apple's live JWKS (RS256); issuer,
 *   audience (APPLE_CLIENT_ID) and expiry checked. Apple only returns the email
 *   on the first authorization — afterwards the profile is just the stable sub.
 * - Account linking: a provider account that already exists signs into its user;
 *   otherwise an existing user with the same verified email gets the provider
 *   linked (same person, no duplicate account); otherwise a new user is created
 *   and the response carries isNewUser=true.
 * - Under-18: a recorded dateOfBirth under 18 years blocks sign-in.
 * - Suspended/deleted accounts are rejected on every login.
 */
@Injectable()
export class SocialService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly tokens: TokenService,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {}

  async google(
    idToken: string,
    deviceName?: string | null,
    ip?: string | null,
  ): Promise<SocialLoginResult> {
    const res = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Google rejected the ID token" });
    }
    const claims = (await res.json()) as GoogleTokenInfoClaims;
    if (this.env.GOOGLE_CLIENT_ID && claims.aud !== this.env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "ID token audience mismatch" });
    }
    if (!claims.sub || Number(claims.exp) * 1000 < Date.now()) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "ID token expired" });
    }
    if (claims.email_verified !== "true") {
      throw new UnauthorizedException({
        code: "EMAIL_NOT_VERIFIED",
        message: "Google account email is not verified",
      });
    }
    return this.upsertSocialUser(
      {
        provider: "google",
        providerAccountId: claims.sub,
        email: claims.email ?? null,
        emailVerified: true,
        name: claims.name ?? null,
        avatarUrl: claims.picture ?? null,
      },
      deviceName,
      ip,
    );
  }

  async apple(
    idToken: string,
    deviceName?: string | null,
    ip?: string | null,
  ): Promise<SocialLoginResult> {
    const claims = await this.verifyAppleToken(idToken);
    if (!claims.sub) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Identity token has no subject" });
    }
    return this.upsertSocialUser(
      {
        provider: "apple",
        providerAccountId: claims.sub,
        email: claims.email ?? null,
        // Apple marks email_verified on first-share only; trust it when present.
        emailVerified: claims.email ? claims.email_verified !== "false" : false,
        name: null,
        avatarUrl: null,
      },
      deviceName,
      ip,
    );
  }

  /** Verify an Apple identity token: RS256 signature against live JWKS + iss/aud/exp. */
  private async verifyAppleToken(idToken: string): Promise<AppleIdTokenClaims> {
    const [headerB64, payloadB64, signatureB64] = idToken.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Malformed identity token" });
    }
    const header = JSON.parse(b64urlToBuffer(headerB64).toString("utf8")) as { kid?: string; alg?: string };
    if (header.alg !== "RS256" || !header.kid) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Unexpected token algorithm" });
    }

    const jwksRes = await fetch(APPLE_JWKS_URL);
    if (!jwksRes.ok) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Could not fetch Apple public keys" });
    }
    const jwks = (await jwksRes.json()) as { keys: AppleJwk[] };
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Signing key not found" });
    }

    const publicKey = createPublicKey({ key: { ...jwk, ext: true } as never, format: "jwk" });
    const valid = rsaVerify(
      "RSA-SHA256",
      Buffer.from(`${headerB64}.${payloadB64}`),
      publicKey,
      b64urlToBuffer(signatureB64),
    );
    if (!valid) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Invalid token signature" });
    }

    const claims = JSON.parse(b64urlToBuffer(payloadB64).toString("utf8")) as AppleIdTokenClaims;
    if (claims.iss !== APPLE_ISSUER) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Issuer mismatch" });
    }
    if (this.env.APPLE_CLIENT_ID && claims.aud !== this.env.APPLE_CLIENT_ID) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Audience mismatch" });
    }
    if (Number(claims.exp) * 1000 < Date.now()) {
      throw new UnauthorizedException({ code: "INVALID_ID_TOKEN", message: "Identity token expired" });
    }
    return claims;
  }

  private async upsertSocialUser(
    profile: SocialProfile,
    deviceName?: string | null,
    ip?: string | null,
  ): Promise<SocialLoginResult> {
    let user: AuthUserRow | undefined;
    let isNewUser = false;

    const existing = await this.repo.findOAuthAccount(profile.provider, profile.providerAccountId);
    if (existing) {
      user = await this.repo.findUserById(existing.userId);
      if (!user) {
        throw new UnauthorizedException({ code: "ACCOUNT_ORPHANED", message: "Linked account has no user" });
      }
    } else {
      // Account linking by verified email: same person signing in with a second
      // provider must land on the existing account, never a duplicate.
      if (profile.email && profile.emailVerified) {
        user = await this.repo.findUserByEmail(profile.email);
        if (user) {
          await this.repo.linkOAuthAccount({
            userId: user.id,
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          });
        }
      }
      if (!user) {
        const base = slugHandle(profile.email?.split("@")[0] ?? `${profile.provider}${profile.providerAccountId.slice(-8)}`);
        let handle = base;
        for (let attempt = 0; attempt < 5 && (await this.repo.findUserByHandle(handle)); attempt += 1) {
          handle = `${base}${randomBytes(2).toString("hex")}`;
        }
        user = await this.repo.createUser({
          handle,
          displayName: profile.name ?? handle,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
        });
        await this.repo.linkOAuthAccount({
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        });
        isNewUser = true;
      }
    }

    assertUserCanAuthenticate(user);
    if (user.dateOfBirth && ageFromDateOfBirth(user.dateOfBirth) < 18) {
      throw new ForbiddenException({
        code: "UNDERAGE_BLOCK",
        message: "Accounts are available to users 18 and older",
      });
    }

    const issued = await this.tokens.issueTokens(user, deviceName, ip);
    return {
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      isNewUser,
      accessToken: issued.accessToken,
      accessTokenExpiresAt: issued.accessTokenExpiresAt,
      refreshToken: issued.refreshToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    };
  }
}
