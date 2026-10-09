import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { schema } from "@moments/db";
import { DatabaseService } from "../health/health.service";

const { users, sessions, oauthAccounts } = schema;

export type SocialProvider = "google" | "apple";

export interface AuthUserRow {
  id: string;
  handle: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  suspendedAt: string | null;
  deletedAt: string | null;
}

export interface AuthSessionRow {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceName: string | null;
  ip: string | null;
  expiresAt: string;
}

/** Narrow persistence surface for auth (C1). In-memory fakes implement this in specs. */
export const AUTH_REPOSITORY = Symbol("AUTH_REPOSITORY");

export interface AuthRepository {
  findUserById(id: string): Promise<AuthUserRow | undefined>;
  findUserByEmail(email: string): Promise<AuthUserRow | undefined>;
  findUserByHandle(handle: string): Promise<AuthUserRow | undefined>;
  createUser(input: {
    handle: string;
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
  }): Promise<AuthUserRow>;
  findOAuthAccount(
    provider: SocialProvider,
    providerAccountId: string,
  ): Promise<{ userId: string } | undefined>;
  linkOAuthAccount(input: {
    userId: string;
    provider: SocialProvider;
    providerAccountId: string;
  }): Promise<void>;
  createSession(input: {
    userId: string;
    refreshTokenHash: string;
    deviceName?: string | null;
    ip?: string | null;
    expiresAt: Date;
  }): Promise<AuthSessionRow>;
  findSessionWithUserByHash(
    refreshTokenHash: string,
  ): Promise<{ session: AuthSessionRow; user: AuthUserRow } | undefined>;
  rotateSession(sessionId: string, newHash: string, expiresAt: Date): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}

function toUserRow(row: typeof users.$inferSelect): AuthUserRow {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    dateOfBirth: row.dateOfBirth,
    suspendedAt: row.suspendedAt,
    deletedAt: row.deletedAt,
  };
}

function toSessionRow(row: typeof sessions.$inferSelect): AuthSessionRow {
  return {
    id: row.id,
    userId: row.userId,
    refreshTokenHash: row.refreshTokenHash,
    deviceName: row.deviceName,
    ip: row.ip,
    expiresAt: row.expiresAt,
  };
}

@Injectable()
export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    const db = this.database.db;
    if (!db) {
      throw new ServiceUnavailableException({
        code: "DATABASE_UNAVAILABLE",
        message: "Auth requires DATABASE_URL to be configured",
      });
    }
    return db;
  }

  async findUserById(id: string) {
    const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    return row ? toUserRow(row) : undefined;
  }

  async findUserByEmail(email: string) {
    const row = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    return row ? toUserRow(row) : undefined;
  }

  async findUserByHandle(handle: string) {
    const row = await this.db.query.users.findFirst({ where: eq(users.handle, handle) });
    return row ? toUserRow(row) : undefined;
  }

  async createUser(input: { handle: string; displayName: string; email?: string | null; avatarUrl?: string | null }) {
    const [row] = await this.db
      .insert(users)
      .values({
        handle: input.handle,
        displayName: input.displayName,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
      })
      .returning();
    if (!row) throw new Error("insert into users returned no row");
    return toUserRow(row);
  }

  async findOAuthAccount(provider: SocialProvider, providerAccountId: string) {
    const row = await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    });
    return row ? { userId: row.userId } : undefined;
  }

  async linkOAuthAccount(input: { userId: string; provider: SocialProvider; providerAccountId: string }) {
    await this.db.insert(oauthAccounts).values(input);
  }

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    deviceName?: string | null;
    ip?: string | null;
    expiresAt: Date;
  }) {
    const [row] = await this.db
      .insert(sessions)
      .values({
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        deviceName: input.deviceName ?? null,
        ip: input.ip ?? null,
        expiresAt: input.expiresAt.toISOString(),
      })
      .returning();
    if (!row) throw new Error("insert into sessions returned no row");
    return toSessionRow(row);
  }

  async findSessionWithUserByHash(refreshTokenHash: string) {
    const sessionRow = await this.db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, refreshTokenHash),
    });
    if (!sessionRow) return undefined;
    const userRow = await this.db.query.users.findFirst({ where: eq(users.id, sessionRow.userId) });
    if (!userRow) return undefined;
    return { session: toSessionRow(sessionRow), user: toUserRow(userRow) };
  }

  async rotateSession(sessionId: string, newHash: string, expiresAt: Date) {
    await this.db
      .update(sessions)
      .set({ refreshTokenHash: newHash, expiresAt: expiresAt.toISOString() })
      .where(eq(sessions.id, sessionId));
  }

  async deleteSession(sessionId: string) {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
