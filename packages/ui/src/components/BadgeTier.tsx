import React from "react";
import { Text, View } from "react-native";

export type BadgeTierName = "new" | "rising" | "core" | "legend";

const tierLabels: Record<BadgeTierName, string> = {
  new: "New",
  rising: "Rising",
  core: "Core",
  legend: "Legend",
};

const tierClasses: Record<BadgeTierName, string> = {
  new: "bg-surface-alt text-text-muted",
  rising: "bg-primary text-on-primary",
  core: "bg-success text-background",
  legend: "bg-danger text-on-danger",
};

/** Creator reputation tier pill (F3.2 / KAN-107; scoring lands in E17). */
export function BadgeTier({ tier }: { tier: BadgeTierName }) {
  return (
    <View
      accessibilityLabel={`Badge tier: ${tierLabels[tier]}`}
      className={`px-2 py-0.5 rounded-full ${tierClasses[tier].split(" ")[0]}`}
    >
      <Text className={`text-xs font-semibold ${tierClasses[tier].split(" ")[1]}`}>
        {tierLabels[tier]}
      </Text>
    </View>
  );
}
