import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Full-width block button (default) vs. hug-content. */
  block?: boolean;
  accessibilityLabel?: string;
}

const containerByVariant: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-surface-alt",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const labelByVariant: Record<ButtonVariant, string> = {
  primary: "text-on-primary",
  secondary: "text-text",
  ghost: "text-primary",
  danger: "text-on-danger",
};

const sizeClasses: Record<ButtonSize, { container: string; label: string }> = {
  sm: { container: "px-3 py-1.5 rounded-md", label: "text-sm" },
  md: { container: "px-4 py-2.5 rounded-lg", label: "text-base" },
  lg: { container: "px-5 py-3 rounded-lg", label: "text-lg" },
};

/** Primitive button (F3.1 / KAN-106). */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  block = true,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const s = sizeClasses[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      className={`flex-row items-center justify-center gap-2 ${s.container} ${containerByVariant[variant]} ${
        block ? "w-full" : "self-start"
      } ${isDisabled ? "opacity-50" : "active:opacity-80"}`}
    >
      {loading ? <ActivityIndicator color="currentColor" /> : null}
      <Text className={`font-semibold ${s.label} ${labelByVariant[variant]}`}>{label}</Text>
    </Pressable>
  );
}
