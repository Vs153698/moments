import React from "react";
import { Text, View } from "react-native";

/** Live indicator pill (F3.2 / KAN-107). */
export function LiveBadge({ label = "LIVE", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <View
      accessibilityLabel={label}
      className={`flex-row items-center gap-1.5 bg-danger rounded-full ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
    >
      <View className={`rounded-full bg-on-danger ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
      <Text className={`font-bold text-on-danger ${compact ? "text-xs" : "text-sm"}`}>{label}</Text>
    </View>
  );
}
