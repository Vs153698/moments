import React from "react";
import { Pressable, Text, View } from "react-native";

export interface SegmentedTabsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Segmented control (F3.1 / KAN-106). */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedTabsProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className="flex-row bg-surface rounded-lg p-1"
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            className={`flex-1 items-center py-1.5 px-2 rounded-md ${selected ? "bg-background" : "active:bg-surface-alt"}`}
          >
            <Text className={`text-sm font-medium ${selected ? "text-text" : "text-text-muted"}`}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
