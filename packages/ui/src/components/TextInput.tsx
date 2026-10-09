import React from "react";
import { Text, TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from "react-native";

export interface TextInputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: string;
  /** Leading glyph (emoji or short prefix). */
  leading?: string;
  accessibilityLabel?: string;
}

/** Labelled text input with error state (F3.1 / KAN-106). */
export function TextInput({ label, error, leading, accessibilityLabel, ...rest }: TextInputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-text">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center px-3 rounded-lg border bg-background ${
          error ? "border-danger" : "border-border"
        }`}
      >
        {leading ? <Text className="mr-2 text-text-muted">{leading}</Text> : null}
        <RNTextInput
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor="var(--color-text-muted)"
          className="flex-1 py-2.5 text-base text-text"
          {...rest}
        />
      </View>
      {error ? (
        <Text className="text-sm text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
