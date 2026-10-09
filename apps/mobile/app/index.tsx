import { Redirect } from "expo-router";
import { useSession } from "../src/auth/session";
import { consumePendingRoute } from "../src/auth/pending-route";

/**
 * Entry (C2a / KAN-115): signed-in users skip S1/S2 and land where they were
 * headed — a remembered deep link if the auth gate stored one, else Home.
 * Signed-out users get the S1 splash; the native splash hold in _layout means
 * no flash of the wrong state.
 */
export default function Index() {
  const { status } = useSession();
  if (status === "signedIn") {
    const pending = consumePendingRoute();
    return <Redirect href={(pending ?? "/(tabs)") as never} />;
  }
  return <Redirect href="/(auth)/splash" />;
}
