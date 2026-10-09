import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import "@moments/ui/global.css";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { useSession } from "../src/auth/session";
import { initObservability } from "../src/lib/observability";

void SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

initObservability();

function ThemedStack() {
  const { scheme } = useTheme();
  return (
    <View className={scheme === "dark" ? "dark flex-1" : "flex-1"}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="moment" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="dev" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </View>
  );
}

/**
 * Root layout (F7.1 / KAN-109): providers — SafeArea, Theme (MMKV), TanStack
 * Query, Sentry/PostHog (no-op without keys). The native splash is held until
 * fonts are loaded AND the session check resolves (KAN-110), so signed-in
 * users never flash the auth screen.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const session = useSession();
  const [queryClientInstance] = useState(() => queryClient);

  useEffect(() => {
    if (fontsLoaded && session.status !== "loading") {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session.status]);

  if (!fontsLoaded || session.status === "loading") return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
