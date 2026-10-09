/**
 * Sentry + PostHog wiring (F7.1 / KAN-109, optional providers).
 * Both are no-ops until the owner provisions projects (KAN-101) and sets the
 * EXPO_PUBLIC_* keys per EAS profile — matching the API-side pattern.
 */
import { init as initSentry } from "@sentry/react-native";
import PostHog from "posthog-react-native";

let postHog: PostHog | null = null;

export function initObservability(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (dsn) {
    initSentry({ dsn, enableAutoSessionTracking: true });
  }
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (key && !postHog) {
    postHog = new PostHog(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    });
  }
}

export function getPostHog(): PostHog | null {
  return postHog;
}

export function isObservabilityConfigured(): { sentry: boolean; posthog: boolean } {
  return {
    sentry: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
    posthog: Boolean(process.env.EXPO_PUBLIC_POSTHOG_KEY),
  };
}
