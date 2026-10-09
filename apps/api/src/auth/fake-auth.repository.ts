import { randomUUID } from "node:crypto";
import type {
  AuthRepository,
  AuthSessionRow,
  AuthUserRow,
  SocialProvider,
} from "./auth.repository";

/**
 * In-memory AuthRepository for service specs. Mirrors the Drizzle semantics the
 * services rely on (unique email/handle, hash-keyed session lookup).
 */
export class FakeAuthRepository implements AuthRepository {
  users = new Map<string, AuthUserRow>();
  sessions = new Map<string, AuthSessionRow>();
  oauthAccounts: Array<{ userId: string; provider: SocialProvider; providerAccountId: string }> = [];

  private handleIndex = new Map<string, string>();
  private emailIndex = new Map<string, string>();

  seedUser(overrides: Partial<AuthUserRow> = {}): AuthUserRow {
    const id = overrides.id ?? randomUUID();
    const user: AuthUserRow = {
      id,
      handle: overrides.handle ?? `user${id.slice(0, 8)}`,
      displayName: overrides.displayName ?? "Test User",
      email: overrides.email ?? null,
      phone: overrides.phone ?? null,
      avatarUrl: null,
      dateOfBirth: null,
      suspendedAt: null,
      deletedAt: null,
      ...overrides,
    };
    this.users.set(id, user);
    this.handleIndex.set(user.handle, id);
    if (user.email) this.emailIndex.set(user.email, id);
    return user;
  }

  async findUserById(id: string) {
    return this.users.get(id);
  }

  async findUserByEmail(email: string) {
    const id = this.emailIndex.get(email);
    return id ? this.users.get(id) : undefined;
  }

  async findUserByHandle(handle: string) {
    const id = this.handleIndex.get(handle);
    return id ? this.users.get(id) : undefined;
  }

  async createUser(input: { handle: string; displayName: string; email?: string | null; avatarUrl?: string | null }) {
    if (this.handleIndex.has(input.handle)) throw new Error(`duplicate handle ${input.handle}`);
    return this.seedUser({ ...input, email: input.email ?? null });
  }

  async findOAuthAccount(provider: SocialProvider, providerAccountId: string) {
    const row = this.oauthAccounts.find(
      (a) => a.provider === provider && a.providerAccountId === providerAccountId,
    );
    return row ? { userId: row.userId } : undefined;
  }

  async linkOAuthAccount(input: { userId: string; provider: SocialProvider; providerAccountId: string }) {
    this.oauthAccounts.push(input);
  }

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    deviceName?: string | null;
    ip?: string | null;
    expiresAt: Date;
  }): Promise<AuthSessionRow> {
    const session: AuthSessionRow = {
      id: randomUUID(),
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      deviceName: input.deviceName ?? null,
      ip: input.ip ?? null,
      expiresAt: input.expiresAt.toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionWithUserByHash(refreshTokenHash: string) {
    const session = [...this.sessions.values()].find((s) => s.refreshTokenHash === refreshTokenHash);
    if (!session) return undefined;
    const user = this.users.get(session.userId);
    if (!user) return undefined;
    return { session, user };
  }

  async rotateSession(sessionId: string, newHash: string, expiresAt: Date) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("session not found");
    this.sessions.set(sessionId, { ...session, refreshTokenHash: newHash, expiresAt: expiresAt.toISOString() });
  }

  async deleteSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
