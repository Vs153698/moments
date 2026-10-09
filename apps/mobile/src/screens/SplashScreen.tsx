import React from "react";
import { ImageBackground, Platform, Pressable, Text, View, useColorScheme } from "react-native";
import { Button } from "@moments/ui";
import heroDark from "../../assets/hero-dark.png";
import heroLight from "../../assets/hero-light.png";

export interface SplashScreenProps {
  /** Override the active theme (tests); defaults to the device colour scheme. */
  theme?: "dark" | "light";
  onCreateAccount: () => void;
  onContinueWithGoogle: () => void;
  onContinueWithApple: () => void;
  onSignIn: () => void;
}

/**
 * S1 Splash (spec 5 screen 1 / KAN-114): full-bleed themed hero, MOMENTS
 * wordmark, tagline, and the three entry points into auth.
 */
export function SplashScreen({
  theme,
  onCreateAccount,
  onContinueWithGoogle,
  onContinueWithApple,
  onSignIn,
}: SplashScreenProps) {
  const scheme = useColorScheme();
  const mode = theme ?? scheme ?? "light";

  return (
    <ImageBackground
      source={mode === "dark" ? heroDark : heroLight}
      resizeMode="cover"
      className="flex-1"
      accessibilityLabel={`Splash hero (${mode} theme)`}
    >
      <View className="flex-1 justify-between bg-black/10 px-6 pb-10 pt-24">
        <View className="items-center">
          <Text className="text-5xl font-bold tracking-[8px] text-white dark:text-white">
            MOMENTS
          </Text>
          <Text className="mt-3 text-center text-lg text-white/90">
            Every plan becomes a memory.
          </Text>
        </View>

        <View className="gap-3">
          <Button label="Create Account" size="lg" onPress={onCreateAccount} accessibilityLabel="Create Account" />
          <Button
            label="Continue with Google"
            size="lg"
            variant="secondary"
            onPress={onContinueWithGoogle}
            accessibilityLabel="Continue with Google"
          />
          {Platform.OS === "ios" && (
            <Button
              label="Continue with Apple"
              size="lg"
              variant="secondary"
              onPress={onContinueWithApple}
              accessibilityLabel="Continue with Apple"
            />
          )}
          <Pressable
            onPress={onSignIn}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign in"
            className="mt-2 items-center py-2"
          >
            <Text className="text-base font-semibold text-white dark:text-white">
              Already have an account? <Text className="underline">Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}
