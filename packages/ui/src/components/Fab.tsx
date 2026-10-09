import React from "react";
import { Pressable, Text } from "react-native";

export interface FabProps {
  /** Glyph label — default "+". */
  label?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  size?: "md" | "lg";
  disabled?: boolean;
}

/** Centre floating action button (F3.2 / KAN-107; tab-bar integration in F7.2). */
export function Fab({
  label = "+",
  onPress,
  accessibilityLabel = "Create moment",
  size = "lg",
  disabled = false,
}: FabProps) {
  const box = size === "lg" ? "w-14 h-14 rounded-2xl" : "w-11 h-11 rounded-xl";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      className={`${box} bg-primary items-center justify-center shadow-lg ${
        disabled ? "opacity-50" : "active:opacity-80"
      }`}
    >
      <Text className="text-on-primary text-2xl font-bold">{label}</Text>
    </Pressable>
  );
}
