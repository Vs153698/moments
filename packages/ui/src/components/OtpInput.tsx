import React from "react";
import { TextInput as RNTextInput, View } from "react-native";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  accessibilityLabel?: string;
}

/**
 * One-time-code boxes (F3.1 / KAN-106): one numeric TextInput per digit,
 * typing auto-advances, backspace on an empty box moves back.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  error = false,
  accessibilityLabel = "One-time code",
}: OtpInputProps) {
  const refs = React.useRef<(RNTextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(-1);
    const next = (value.padEnd(length).slice(0, length).split("").map((c, i) => (i === index ? clean : c)))
      .join("")
      .trimEnd();
    onChange(next);
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      // Clear the previous box and move focus back.
      const next = value.slice(0, index - 1) + value.slice(index);
      onChange(next);
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View accessibilityLabel={accessibilityLabel} className="flex-row gap-2">
      {digits.map((digit, i) => (
        <RNTextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          testID={`otp-box-${i}`}
          value={digit}
          onChangeText={(text) => setDigit(i, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          accessibilityLabel={`${accessibilityLabel} digit ${i + 1}`}
          className={`w-11 h-12 text-center text-xl font-semibold rounded-lg border bg-background ${
            error ? "border-danger text-danger" : i === value.length ? "border-primary text-text" : "border-border text-text"
          }`}
        />
      ))}
    </View>
  );
}
