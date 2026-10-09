import { Redirect, Tabs } from "expo-router";
import { useSession } from "../../src/auth/session";
import { AppTabBar } from "../../src/navigation/AppTabBar";

/** Tabs gate + custom tab bar with centre FAB (KAN-109 route tree / KAN-110 bar). */
export default function TabsLayout() {
  const { status } = useSession();
  if (status === "signedOut") return <Redirect href="/(auth)/phone" />;
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="map" options={{ title: "Map", href: null }} />
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
