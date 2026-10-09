import { router } from "expo-router";
import { SplashScreen } from "../../src/screens/SplashScreen";
import { hasCompletedOnboarding } from "../../src/auth/onboarding";

/**
 * S1 Splash route (KAN-114). Create Account runs first-run users through the
 * S2 carousel; everyone else goes to the unified S2a sign in / sign up screen
 * (KAN-33). Social buttons also lead to that screen so there is one clear
 * entry point for all auth methods.
 */
export default function SplashRoute() {
  return (
    <SplashScreen
      onCreateAccount={() => {
        if (hasCompletedOnboarding()) router.push("/(auth)/phone");
        else router.push("/(auth)/onboarding");
      }}
      onContinueWithGoogle={() => router.push("/(auth)/phone")}
      onContinueWithApple={() => router.push("/(auth)/phone")}
      onSignIn={() => router.push("/(auth)/phone")}
    />
  );
}
