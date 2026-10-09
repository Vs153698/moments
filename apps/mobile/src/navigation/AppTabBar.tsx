import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fab } from "@moments/ui";

interface TabSpec {
  name: string;
  label: string;
  glyph: string;
}

/** Structural subset of the React Navigation tab bar props we rely on. */
export interface AppTabBarProps {
  state: { routes: { name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
}

/** The four primary tabs; the map is reachable from Explore (and the dev menu). */
const TABS: TabSpec[] = [
  { name: "index", label: "Home", glyph: "🏠" },
  { name: "explore", label: "Explore", glyph: "🔍" },
  { name: "chats", label: "Chats", glyph: "💬" },
  { name: "profile", label: "Profile", glyph: "👤" },
];

/**
 * Bottom tab bar with a centre FAB (F7.2 / KAN-110):
 * Home · Explore · (＋ create FAB) · Chats · Profile.
 */
export function AppTabBar({ state, navigation }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (spec: TabSpec) => {
    const routeIndex = state.routes.findIndex((r) => r.name === spec.name);
    const focused = routeIndex === state.index;
    return (
      <Pressable
        key={spec.name}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={spec.label}
        onPress={() => navigation.navigate(spec.name)}
        className="flex-1 items-center py-2 gap-0.5"
      >
        <Text className="text-lg">{spec.glyph}</Text>
        <Text className={`text-[10px] font-medium ${focused ? "text-primary" : "text-text-muted"}`}>
          {spec.label}
        </Text>
      </Pressable>
    );
  };

  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  return (
    <View
      className="flex-row items-end bg-surface border-t border-border"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {left.map(renderTab)}
      <View className="flex-1 items-center" style={{ marginTop: -22 }}>
        <Fab onPress={() => router.push("/moment/create")} />
      </View>
      {right.map(renderTab)}
    </View>
  );
}
