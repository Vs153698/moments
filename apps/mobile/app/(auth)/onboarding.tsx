import { Redirect, router } from "expo-router";
import { OnboardingScreen } from "../../src/screens/OnboardingScreen";
import { hasCompletedOnboarding, markOnboardingCompleted } from "../../src/auth/onboarding";

/**
 * S2 Onboarding carousel route (KAN-115). "Shown once": an already-completed
 * install bounces straight to phone sign-up instead of re-rendering slides.
 */
export default function OnboardingRoute() {
  if (hasCompletedOnboarding()) return <Redirect href="/(auth)/phone" />;
  return (
    <OnboardingScreen
      onDone={() => {
        markOnboardingCompleted();
        router.replace("/(auth)/phone");
      }}
    />
  );
}
