/** Shared primitive types used across the Moments monorepo. */

export type Id = string;

export type ISODateString = string;

export type ISODuration = string;

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface HealthCheckResult {
  status: "ok" | "degraded" | "down";
  version: string;
  uptimeSeconds: number;
  checks: Record<string, "pass" | "fail">;
}

/** Privacy levels a Moment can have. Mirrors spec section 6 data model. */
export type MomentPrivacy = "public" | "invite_only" | "private";
