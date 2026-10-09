import { Redirect } from "expo-router";
import { useSession } from "../src/auth/session";

/** Entry: signed-in users land on tabs, others on phone sign-in. */
export default function Index() {
  const { status } = useSession();
  if (status === "signedIn") return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/phone" />;
}
