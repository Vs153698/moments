import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { darkColors, lightColors, radius, spacing, typography, type ColorScheme, type ThemeMode } from "@moments/ui";
import { useTheme } from "../theme/ThemeProvider";

const swatches = (scheme: ColorScheme) =>
  (Object.keys(scheme) as (keyof ColorScheme)[]).map((name) => ({ name, hex: scheme[name] }));

const typeSamples = (Object.keys(typography.sizes) as (keyof typeof typography.sizes)[]).map(
  (size) => ({ size, px: typography.sizes[size], lh: typography.lineHeights[size] }),
);

/**
 * F2 acceptance screen: renders the full palette and type scale in the CURRENT
 * mode, with a System/Dark/Light switch — flip between modes to verify both.
 * The full /dev/components gallery lands with F3/F7 (KAN-108/KAN-110).
 */
export function DevThemeScreen() {
  const { preference, scheme, setPreference } = useTheme();
  const colors = scheme === "dark" ? darkColors : lightColors;
  const modes: ThemeMode[] = ["system", "dark", "light"];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-4">
        <Text className="text-2xl font-bold text-text">Design tokens ({scheme})</Text>

        <View className="flex-row gap-2">
          {modes.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setPreference(mode)}
              className={`px-4 py-2 rounded-full ${preference === mode ? "bg-primary" : "bg-surface-alt"}`}
            >
              <Text className={preference === mode ? "text-on-primary font-semibold" : "text-text"}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-lg font-semibold text-text">Palette</Text>
        <View className="gap-2">
          {swatches(colors).map(({ name, hex }) => (
            <View key={name} className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-md border"
                style={{ backgroundColor: hex, borderColor: colors.border, borderRadius: radius.md }}
              />
              <View>
                <Text className="text-base font-medium text-text">{name}</Text>
                <Text className="text-sm text-text-muted">{hex}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-lg font-semibold text-text">Type scale (Inter)</Text>
        <View className="gap-3" style={{ rowGap: spacing[3] }}>
          {typeSamples.map(({ size, px, lh }) => (
            <View key={size}>
              <Text className="text-text-muted text-xs">
                {size} · {px}px / {lh}px
              </Text>
              <Text style={{ fontSize: px, lineHeight: lh }} className="text-text">
                Moments bring people together
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
