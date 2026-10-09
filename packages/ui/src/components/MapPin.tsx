import React from "react";
import { Text, View } from "react-native";

export interface MapPinProps {
  label?: string;
  /** Emphasised "selected" style for the focused moment. */
  active?: boolean;
}

/** Moment pin for map surfaces (F3.2 / KAN-107). */
export function MapPin({ label, active = false }: MapPinProps) {
  return (
    <View accessibilityLabel={label ?? "Moment location"} className="items-center">
      <View
        className={`px-2.5 py-1.5 rounded-full border ${
          active ? "bg-primary border-primary" : "bg-surface border-border"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${active ? "text-on-primary" : "text-text"}`}
          numberOfLines={1}
        >
          {label ?? "📍"}
        </Text>
      </View>
      <View
        className={`w-2 h-2 rotate-45 -mt-1 ${active ? "bg-primary" : "bg-surface border-border"}`}
        style={{ borderWidth: 0 }}
      />
    </View>
  );
}
