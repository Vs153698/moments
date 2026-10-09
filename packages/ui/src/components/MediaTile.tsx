import React from "react";
import { Image, Pressable, Text, View } from "react-native";

export interface MediaTileProps {
  uri?: string;
  /** Number shown on the final "+N" tile. */
  overflowCount?: number;
  label?: string;
  size?: number;
  onPress?: () => void;
}

/** Square media thumbnail with optional overflow counter (F3.2 / KAN-107). */
export function MediaTile({ uri, overflowCount, label, size = 96, onPress }: MediaTileProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: "imagebutton" as const } : {})}
      accessibilityLabel={label ?? (overflowCount ? `${overflowCount} more items` : "Media")}
      className="rounded-md overflow-hidden bg-surface-alt"
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" accessibilityLabel={label} />
      ) : null}
      {overflowCount ? (
        <View className="absolute inset-0 items-center justify-center bg-background/60">
          <Text className="text-lg font-bold text-text">+{overflowCount}</Text>
        </View>
      ) : null}
    </Wrapper>
  );
}
