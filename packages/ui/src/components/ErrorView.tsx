import React from "react";
import { Text, View } from "react-native";
import { Button } from "./Button";

export interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Full-block error state with retry (F3.1 / KAN-106). */
export function ErrorView({
  title = "Something went wrong",
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
}: ErrorViewProps) {
  return (
    <View className="items-center gap-2 px-8 py-12" accessibilityRole="alert">
      <Text className="text-lg font-semibold text-text text-center">{title}</Text>
      <Text className="text-sm text-text-muted text-center">{message}</Text>
      {onRetry ? (
        <View className="mt-3 w-full">
          <Button label={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
