import { router } from "expo-router";
import { SplashScreen } from "../../src/screens/SplashScreen";
import { hasCompletedOnboarding } from "../../src/auth/onboarding";

/**
 * S1 Splash route (KAN-114). Create Account runs first-run users through the
 * S2 carousel; everyone else goes straight to phone sign-up. Social buttons
 * land on the phone flow until C2b (KAN-33) wires the token handlers.
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
