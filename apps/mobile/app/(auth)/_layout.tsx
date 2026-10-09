import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/auth/session";

/** Auth group gate: signed-in users never see sign-in screens. */
export default function AuthLayout() {
  const { status } = useSession();
  if (status === "signedIn") return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
