/**
 * Observability smoke test (F8.3 / KAN-103).
 *
 * Fires one test event per configured backend and reports which are active:
 *   - Sentry: captured message
 *   - PostHog: `observability_smoke_test` event
 *   - Better Stack: an error-level log line through the drain
 *
 * Run: pnpm --filter @moments/api run test:events
 * Exit 0 always; exits 1 only if a *configured* backend fails to accept the
 * event (network errors included).
 */
import { initSentry, reportException } from "../src/common/sentry";
import { captureEvent, initPostHog, isPostHogEnabled, shutdownPostHog } from "../src/common/posthog";
import { betterStackDrain, createLogger } from "../src/common/logger";
import { parseEnv } from "../src/config/env";

async function main(): Promise<void> {
  const env = parseEnv();
  const results: Record<string, string> = {};

  // Sentry
  if (env.SENTRY_DSN) {
    try {
      initSentry(env);
      reportException(new Error("moments observability smoke test"));
      results.sentry = "sent (message + exception)";
    } catch (err) {
      results.sentry = `FAILED: ${String(err)}`;
      process.exitCode = 1;
    }
  } else {
    results.sentry = "not configured (set SENTRY_DSN)";
  }

  // PostHog
  if (env.POSTHOG_KEY) {
    try {
      initPostHog(env);
      captureEvent("observability-smoke-test", "observability_smoke_test", {
        environment: env.NODE_ENV,
        source: "api",
      });
      await shutdownPostHog();
      results.posthog = isPostHogEnabled() ? "sent (event captured)" : "sent (flushed + client closed)";
    } catch (err) {
      results.posthog = `FAILED: ${String(err)}`;
      process.exitCode = 1;
    }
  } else {
    results.posthog = "not configured (set POSTHOG_KEY)";
  }

  // Better Stack (via logger drain)
  if (env.BETTERSTACK_SOURCE_TOKEN) {
    const failures: unknown[] = [];
    const drain = (line: string) => {
      void fetch(`https://in.logs.betterstack.com/${env.BETTERSTACK_SOURCE_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: line,
      }).catch((err) => failures.push(err));
    };
    createLogger("info", { log: () => {} }, drain).error("moments observability smoke test log", {
      environment: env.NODE_ENV,
    });
    await new Promise((r) => setTimeout(r, 1500));
    if (failures.length > 0) {
      results.betterstack = `FAILED: ${String(failures[0])}`;
      process.exitCode = 1;
    } else {
      results.betterstack = "sent (error log line)";
    }
  } else {
    results.betterstack = "not configured (set BETTERSTACK_SOURCE_TOKEN)";
  }

  console.log(
    JSON.stringify({ level: "info", msg: "observability smoke test", env: env.NODE_ENV, results }),
  );
}

void main();
