import React from "react";
import { Pressable, Text, View } from "react-native";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading glyph (emoji or single letter). */
  leading?: string;
  accessibilityLabel?: string;
}

/** Selectable chip (F3.1 / KAN-106). */
export function Chip({ label, selected = false, onPress, leading, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className={`flex-row items-center px-3 py-1.5 rounded-full border ${
        selected ? "bg-primary border-primary" : "bg-surface border-border"
      } ${onPress && !selected ? "active:bg-surface-alt" : ""}`}
    >
      {leading ? (
        <View className="mr-1">
          <Text className={selected ? "text-on-primary" : "text-text"}>{leading}</Text>
        </View>
      ) : null}
      <Text className={`text-sm font-medium ${selected ? "text-on-primary" : "text-text"}`}>{label}</Text>
    </Pressable>
  );
}
