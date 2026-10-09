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
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const APP_ENV = Symbol("APP_ENV");

export function parseEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(source);
}
