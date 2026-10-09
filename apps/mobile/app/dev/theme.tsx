import React from "react";
import { View } from "react-native";
import { useTheme } from "@moments/ui";
import { DevThemeScreen } from "../../src/screens/DevThemeScreen";

/** Theme token screen (F2 acceptance) — now routed under /dev. */
export default function DevThemeRoute() {
  const { scheme } = useTheme();
  return (
    <View className={scheme === "dark" ? "dark flex-1" : "flex-1"}>
      <DevThemeScreen />
    </View>
  );
}
