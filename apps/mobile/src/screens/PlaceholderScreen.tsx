import React from "react";
import { Text, View } from "react-native";

/**
 * Placeholder screen (F7.1 / KAN-109): every route renders something
 * navigable; feature content lands with the epics that own each screen.
 */
export function PlaceholderScreen({ title, description }: { title: string; description?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background gap-2 px-6">
      <Text className="text-2xl font-bold text-text text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-text-muted text-center">{description}</Text>
      ) : (
        <Text className="text-sm text-text-muted text-center">Coming soon — route is live, content lands in a later epic.</Text>
      )}
    </View>
  );
}
