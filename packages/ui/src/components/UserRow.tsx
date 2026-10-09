import React from "react";
import { Pressable, Text, View } from "react-native";

export interface UserRowProps {
  name: string;
  handle?: string;
  /** Short status line, e.g. "Host" or "2 mutual moments". */
  meta?: string;
  onPress?: () => void;
  /** Trailing action label (e.g. "Follow"). */
  actionLabel?: string;
  onAction?: () => void;
}

/** User list row with optional trailing action (F3.2 / KAN-107). */
export function UserRow({ name, handle, meta, onPress, actionLabel, onAction }: UserRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface"
    >
      <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
        <Text className="text-sm font-bold text-on-primary">{(name[0] ?? "?").toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-text" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs text-text-muted" numberOfLines={1}>
          {[handle, meta].filter(Boolean).join(" · ")}
        </Text>
      </View>
      {actionLabel ? (
        <Text onPress={onAction} className="text-sm font-semibold text-primary">
          {actionLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}
