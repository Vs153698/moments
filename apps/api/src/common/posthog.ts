import { PostHog } from "posthog-node";
import type { AppEnv } from "../config/env";

let client: PostHog | null = null;

/**
 * Initialize the PostHog server-side client when a key is configured (F8).
 * Every event carries `environment` so one project can serve all envs.
 */
export function initPostHog(env: AppEnv): void {
  if (!env.POSTHOG_KEY) return;
  client = new PostHog(env.POSTHOG_KEY, {
    host: env.POSTHOG_HOST,
    flushAt: 10,
    flushInterval: 10_000,
  });
}

export type CaptureProperties = Record<string, string | number | boolean | null>;

export function captureEvent(
  distinctId: string,
  event: string,
  properties: CaptureProperties = {},
): void {
  client?.capture({ distinctId, event, properties });
}

/** Flush pending events — call during graceful shutdown. */
export async function shutdownPostHog(): Promise<void> {
  if (!client) return;
  await client.shutdown();
  client = null;
}

/** Test-only escape hatch: whether a backend client is active. */
export function isPostHogEnabled(): boolean {
  return client !== null;
}
