/**
 * Minimal react-native stub for the vitest component tests (KAN-108).
 *
 * React Native ships Flow-typed source that vitest/esbuild cannot parse, so
 * tests render against this stub: every component becomes a host element with
 * the same name, which @testing-library/react-native's string-based queries
 * (byText on "Text", byRole via accessibilityRole, byLabelText) match. This
 * keeps tests focused on our components' props/state/a11y wiring; on-device
 * rendering is covered by the /dev/components gallery.
 */
import React from "react";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };

function host(name: string) {
  return function HostComponent({ children, ...props }: AnyProps) {
    return React.createElement(name, props, children);
  };
}

export const View = host("View");
export const Text = host("Text");
export const Pressable = host("Pressable");
export const ScrollView = host("ScrollView");
export const Image = host("Image");
export const ImageBackground = host("ImageBackground");
export const TextInput = host("TextInput");
export const ActivityIndicator = host("ActivityIndicator");

/** Tests run as iOS so both social-entry buttons render by default. */
export const Platform = {
  OS: "ios" as string,
  select: <T,>(options: Record<string, T>): T | undefined =>
    options[Platform.OS] ?? options.default,
};

export function Modal({ visible, children }: AnyProps & { visible?: boolean }) {
  return visible ? React.createElement("Modal", {}, children) : null;
}

export const Animated = {
  Value: class Value {
    constructor(public initial: number) {}
    setValue(v: number) {
      this.initial = v;
    }
  },
  View: host("AnimatedView"),
  timing: (value: { setValue: (v: number) => void }, config: { toValue?: number } = {}) => ({
    start: (cb?: (() => void) | undefined) => {
      value.setValue(typeof config.toValue === "number" ? config.toValue : 0);
      cb?.();
    },
  }),
};

export function useColorScheme(): "dark" | "light" | null {
  return null;
}

export type GestureResponderEvent = { nativeEvent: unknown };
export type NativeSyntheticEvent<T> = { nativeEvent: T };
export type TextInputKeyPressEventData = { key: string };
