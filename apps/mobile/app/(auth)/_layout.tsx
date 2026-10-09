import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/auth/session";
import { consumePendingRoute } from "../../src/auth/pending-route";

/** Auth group gate: signed-in users never see sign-in screens. */
export default function AuthLayout() {
  const { status } = useSession();
  if (status === "signedIn") {
    const pending = consumePendingRoute();
    return <Redirect href={(pending ?? "/(tabs)") as never} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
