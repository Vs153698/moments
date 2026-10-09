import React from "react";
import { Text, View } from "react-native";

export interface AvatarStackProps {
  /** Initials or short labels, first = front-most. */
  names: string[];
  max?: number;
  size?: "sm" | "md";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Overlapping participant avatars (F3.2 / KAN-107). */
export function AvatarStack({ names, max = 4, size = "md" }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;
  const box = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <View className="flex-row" accessibilityLabel={`${names.length} participants`}>
      {visible.map((name, i) => (
        <View
          key={`${name}-${i}`}
          className={`${box} rounded-full bg-primary items-center justify-center border-2 border-background`}
          style={{ marginLeft: i === 0 ? 0 : size === "sm" ? -6 : -8, zIndex: visible.length - i }}
        >
          <Text className={`${textSize} font-semibold text-on-primary`}>{initials(name)}</Text>
        </View>
      ))}
      {overflow > 0 ? (
        <View
          className={`${box} rounded-full bg-surface-alt items-center justify-center border-2 border-background`}
          style={{ marginLeft: size === "sm" ? -6 : -8 }}
        >
          <Text className={`${textSize} font-semibold text-text-muted`}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}
