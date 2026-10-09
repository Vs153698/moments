import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, useTheme } from "@moments/ui";
import { ROUTES, ROUTE_GROUPS, type RouteGroup } from "../../src/routes";
import { signOut } from "../../src/auth/session";
import { isObservabilityConfigured } from "../../src/lib/observability";

const groupLabels: Record<RouteGroup, string> = {
  auth: "Auth",
  tabs: "Tabs",
  moment: "Moment",
  chat: "Chat",
  account: "Account",
  safety: "Safety",
  dev: "Dev",
};

/**
 * Dev menu (F7.2 / KAN-110): lists every route in the manifest — the
 * "all routes navigable" acceptance of epic KAN-5 — plus session and
 * observability state.
 */
export default function DevMenuScreen() {
  const { preference, scheme, setPreference } = useTheme();
  const observability = isObservabilityConfigured();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-4">
        <Text className="text-2xl font-bold text-text">Dev menu</Text>

        <View className="gap-1">
          <Text className="text-sm text-text-muted">
            theme: {scheme} (prefers {preference})
          </Text>
          <Text className="text-sm text-text-muted">
            sentry: {observability.sentry ? "configured" : "off"} · posthog:{" "}
            {observability.posthog ? "configured" : "off"}
          </Text>
        </View>

        <View className="flex-row gap-2">
          {(["system", "dark", "light"] as const).map((mode) => (
            <Button
              key={mode}
              label={mode}
              size="sm"
              block={false}
              variant={preference === mode ? "primary" : "secondary"}
              onPress={() => setPreference(mode)}
            />
          ))}
          <Button label="Sign out" size="sm" block={false} variant="ghost" onPress={() => signOut()} />
        </View>

        {ROUTE_GROUPS.map((group) => (
          <View key={group} className="gap-1">
            <Text className="text-base font-semibold text-text">{groupLabels[group]}</Text>
            {ROUTES.filter((r) => r.group === group).map((route) => (
              <Link key={route.path} href={route.path as never} asChild>
                <Pressable className="flex-row items-center justify-between py-2 border-b border-border">
                  <Text className="text-base text-text">{route.title}</Text>
                  <Text className="text-xs text-text-muted">
                    {route.implemented ? "✅" : "placeholder"} ›
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
