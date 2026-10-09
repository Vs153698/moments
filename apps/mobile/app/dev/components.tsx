import React from "react";
import { View } from "react-native";
import { ComponentGallery, useTheme } from "@moments/ui";

/** /dev/components — every component variant in the current theme (KAN-108/110). */
export default function DevComponentsScreen() {
  const { scheme } = useTheme();
  return (
    <View className={scheme === "dark" ? "dark flex-1" : "flex-1"}>
      <ComponentGallery />
    </View>
  );
}
