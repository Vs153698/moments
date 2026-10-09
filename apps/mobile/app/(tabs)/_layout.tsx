import { Redirect, Tabs, useGlobalSearchParams, usePathname } from "expo-router";
import { useSession } from "../../src/auth/session";
import { rememberPendingRoute } from "../../src/auth/pending-route";
import { AppTabBar } from "../../src/navigation/AppTabBar";

/**
 * Tabs gate + custom tab bar with centre FAB (KAN-109 route tree / KAN-110 bar).
 * A signed-out visitor (e.g. a protected deep link) is sent to S1 splash with
 * the intended route remembered, so post-auth carry-through restores it.
 */
export default function TabsLayout() {
  const { status } = useSession();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  if (status === "signedOut") {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    rememberPendingRoute(query ? `${pathname}?${query}` : pathname);
    return <Redirect href="/(auth)/splash" />;
  }
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="map" options={{ title: "Map", href: null }} />
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="profile" options={{ title: "My profile" }} />
    </Tabs>
  );
}
