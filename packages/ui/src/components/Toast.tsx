import React, { useEffect } from "react";
import { Text, View } from "react-native";

export type ToastVariant = "info" | "success" | "error";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  /** Optional action (e.g. Undo). */
  actionLabel?: string;
  onAction?: () => void;
}

const dotByVariant: Record<ToastVariant, string> = {
  info: "bg-primary",
  success: "bg-success",
  error: "bg-danger",
};

/** Inline toast banner (F3.1 / KAN-106). Mount/unmount with `visible`. */
export function Toast({ message, variant = "info", visible, actionLabel, onAction }: ToastProps) {
  useEffect(() => {
    // Intentionally no timer here — the caller owns duration.
  }, []);
  if (!visible) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="flex-row items-center gap-2 px-4 py-3 rounded-lg bg-surface-alt"
    >
      <View className={`w-2 h-2 rounded-full ${dotByVariant[variant]}`} />
      <Text className="flex-1 text-sm text-text">{message}</Text>
      {actionLabel ? (
        <Text onPress={onAction} className="text-sm font-semibold text-primary">
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}
