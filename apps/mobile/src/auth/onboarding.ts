import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "moments-onboarding" });

/** Bumping this version re-shows the carousel to existing installs. */
export const ONBOARDING_VERSION = "v1";
const KEY = `onboarding-completed-${ONBOARDING_VERSION}`;

/** S2 carousel (C2a.2 / KAN-115): shown once per install, then never again. */
export function hasCompletedOnboarding(): boolean {
  return storage.getBoolean(KEY) ?? false;
}

export function markOnboardingCompleted(): void {
  storage.set(KEY, true);
}

/** Test/dev helper — not used by app code. */
export function clearOnboardingForTests(): void {
  storage.delete(KEY);
}
