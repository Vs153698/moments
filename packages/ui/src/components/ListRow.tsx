import React, { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Left adornment (avatar, icon, glyph). */
  left?: ReactNode;
  /** Right adornment (chevron, toggle, metadata). */
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Standard list row (F3.1 / KAN-106). */
export function ListRow({ title, subtitle, left, right, onPress, accessibilityLabel }: ListRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress
        ? { accessibilityRole: "button" as const, onPress, accessibilityLabel: accessibilityLabel ?? title }
        : {})}
      className={`flex-row items-center gap-3 px-4 py-3 ${onPress ? "active:bg-surface" : ""}`}
    >
      {left ? <View>{left}</View> : null}
      <View className="flex-1">
        <Text className="text-base text-text font-medium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-text-muted mt-0.5" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </Wrapper>
  );
}
