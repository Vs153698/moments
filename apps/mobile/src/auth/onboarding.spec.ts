import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOnboardingForTests,
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from "./onboarding";
import {
  clearPendingRouteForTests,
  consumePendingRoute,
  rememberPendingRoute,
} from "./pending-route";

beforeEach(() => {
  clearOnboardingForTests();
  clearPendingRouteForTests();
});

describe("onboarding first-run flag (KAN-115)", () => {
  it("starts incomplete and persists completion (shown once)", () => {
    expect(hasCompletedOnboarding()).toBe(false);
    markOnboardingCompleted();
    expect(hasCompletedOnboarding()).toBe(true);
    // survives re-reads from storage — never shown twice
    expect(hasCompletedOnboarding()).toBe(true);
  });
});

describe("pending-route carry-through (KAN-115)", () => {
  it("remembers and one-shot consumes a deep link target", () => {
    rememberPendingRoute("/moment/abc123");
    expect(consumePendingRoute()).toBe("/moment/abc123");
    // second consume is empty — the redirect happens once
    expect(consumePendingRoute()).toBeUndefined();
  });

  it("ignores the root path (nothing meaningful to restore)", () => {
    rememberPendingRoute("/");
    expect(consumePendingRoute()).toBeUndefined();
  });
});
