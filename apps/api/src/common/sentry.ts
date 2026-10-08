import { captureException, init } from "@sentry/node";
import type { AppEnv } from "../config/env";

let enabled = false;

/** Initialize Sentry when a DSN is configured (F5.1; expanded in F8). */
export function initSentry(env: AppEnv): void {
  if (!env.SENTRY_DSN) return;
  init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
  enabled = true;
}

export function reportException(exception: unknown): void {
  if (enabled) captureException(exception);
}
