/**
 * Moments design tokens (F2.1 / KAN-104) — spec sections 3.1–3.3.
 *
 * This file is the SINGLE SOURCE OF TRUTH for colour values in the monorepo:
 * the ESLint rule @moments/no-hardcoded-hex bans hex literals everywhere
 * outside packages/ui/src (epic KAN-5 acceptance). Components must reference
 * these tokens, via NativeWind classes (generated config + CSS vars) or
 * direct imports.
 *
 * Every body-text pair below is contrast-checked ≥ 4.5:1 in tokens.spec.ts
 * (epic KAN-5 acceptance) in both modes.
 */

/** Semantic colour scale, defined per mode. */
export interface ColorScheme {
  /** App background. */
  background: string;
  /** Cards, sheets, inputs. */
  surface: string;
  /** Elevated surface (toolbars, sticky headers). */
  surfaceAlt: string;
  /** Primary brand colour — buttons, active states. */
  primary: string;
  /** Text/icon placed on primary. */
  onPrimary: string;
  /** Primary body text. */
  text: string;
  /** Secondary text (captions, metadata). */
  textMuted: string;
  /** Hairline borders, dividers. */
  border: string;
  /** Destructive actions. */
  danger: string;
  /** Text on danger buttons. */
  onDanger: string;
  /** Confirmations, success states. */
  success: string;
}

export const lightColors: ColorScheme = {
  background: "#FFFFFF",
  surface: "#F6F6F9",
  surfaceAlt: "#ECECF2",
  primary: "#6D5DF6",
  onPrimary: "#FFFFFF",
  text: "#17171F",
  textMuted: "#5A5A66",
  border: "#DCDCE4",
  danger: "#D93A3A",
  onDanger: "#FFFFFF",
  success: "#1E8A4C",
};

export const darkColors: ColorScheme = {
  background: "#121218",
  surface: "#1C1C26",
  surfaceAlt: "#262633",
  primary: "#8B7DFF",
  onPrimary: "#121218",
  text: "#F2F2F7",
  textMuted: "#9C9CA8",
  border: "#34343F",
  danger: "#F26D6D",
  onDanger: "#121218",
  success: "#4CC97E",
};

/** Every pair that must meet WCAG AA for normal body text (≥ 4.5:1). */
export const requiredBodyTextPairs = [
  ["text", "background"],
  ["text", "surface"],
  ["text", "surfaceAlt"],
  ["textMuted", "background"],
  ["textMuted", "surface"],
  ["onPrimary", "primary"],
  ["onDanger", "danger"],
] as const;

export type ColorToken = keyof ColorScheme;

/** Inter-based type scale (spec 3.2). Sizes in dp/pt. */
export const typography = {
  fontFamily: "Inter",
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 26,
    xl: 28,
    "2xl": 32,
    "3xl": 38,
    "4xl": 44,
  },
} as const;

export type TypeSize = keyof typeof typography.sizes;

/** Spacing scale in dp/pt (spec 3.3). */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Corner radii in dp/pt. */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

export type ThemeMode = "system" | "dark" | "light";

/** CSS variable names exposed to NativeWind (see generated global.css). */
export const cssVarNames: Record<ColorToken, string> = {
  background: "--color-background",
  surface: "--color-surface",
  surfaceAlt: "--color-surface-alt",
  primary: "--color-primary",
  onPrimary: "--color-on-primary",
  text: "--color-text",
  textMuted: "--color-text-muted",
  border: "--color-border",
  danger: "--color-danger",
  onDanger: "--color-on-danger",
  success: "--color-success",
};
