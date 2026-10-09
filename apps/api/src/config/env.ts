import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  /** App version reported by /v1/health. */
  APP_VERSION: z.string().default("0.1.0"),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().min(1).optional(),
  POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),
  BETTERSTACK_SOURCE_TOKEN: z.string().min(1).optional(),
  /** Auth / OTP (C1.2). Secrets live in env only — never commit real values. */
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_MAX_PER_HOUR: z.coerce.number().int().positive().default(5),
  /** HMAC secret for dev session tokens. Ephemeral per boot when unset (dev); required in production. */
  OTP_JWT_SECRET: z.string().min(1).optional(),
  MSG91_AUTH_KEY: z.string().min(1).optional(),
  MSG91_SENDER_ID: z.string().min(1).optional(),
  MSG91_TEMPLATE_ID: z.string().min(1).optional(),
  /**
   * "true"/"false" override; default: on (show OTP in the API response) outside
   * production, off in production. Dev testing only (owner directive).
   */
  DEV_OTP_ON_SCREEN: z.enum(["true", "false"]).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const APP_ENV = Symbol("APP_ENV");

export function parseEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(source);
}
