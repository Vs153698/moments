import React from "react";
import { Text, View } from "react-native";

export interface StatBlockProps {
  value: string | number;
  label: string;
  /** Compact inline style for tight rows. */
  compact?: boolean;
}

/** Metric display, e.g. "24 joined · 132 media" (F3.2 / KAN-107). */
export function StatBlock({ value, label, compact = false }: StatBlockProps) {
  if (compact) {
    return (
      <View className="flex-row items-baseline gap-1">
        <Text className="text-sm font-semibold text-text">{value}</Text>
        <Text className="text-xs text-text-muted">{label}</Text>
      </View>
    );
  }
  return (
    <View className="items-center gap-0.5">
      <Text className="text-2xl font-bold text-text">{value}</Text>
      <Text className="text-xs text-text-muted">{label}</Text>
    </View>
  );
}
