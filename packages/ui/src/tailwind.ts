/**
 * NativeWind v4 / Tailwind config generated from tokens (F2.2 / KAN-105).
 * Colours are wired to CSS variables defined in global.css so one utility
 * class works in both modes (`.dark` swaps the variables).
 */
import { cssVarNames, darkColors, lightColors, radius, spacing, typography, type ColorScheme } from "./tokens";

const varRef = (token: keyof ColorScheme) => `var(${cssVarNames[token]})`;

export function createTailwindConfig(content: string[] = []) {
  return {
    content: ["./src/**/*.{ts,tsx}", ...content],
    // nativewind/preset is attached by the consuming app's tailwind.config.js
    // (the app owns the nativewind dependency).
    darkMode: "class",
    theme: {
      extend: {
        colors: Object.fromEntries(
          (Object.keys(lightColors) as (keyof ColorScheme)[]).map((token) => [token, varRef(token)]),
        ),
        fontFamily: { sans: [typography.fontFamily] },
        fontSize: Object.fromEntries(
          (Object.keys(typography.sizes) as (keyof typeof typography.sizes)[]).map((size) => [
            size,
            [
              `${typography.sizes[size]}px`,
              { lineHeight: `${typography.lineHeights[size]}px` },
            ],
          ]),
        ),
        spacing: Object.fromEntries(
          (Object.keys(spacing) as unknown as (keyof typeof spacing)[]).map((step) => [
            step,
            `${spacing[step]}px`,
          ]),
        ),
        borderRadius: Object.fromEntries(
          (Object.keys(radius) as (keyof typeof radius)[]).map((r) => [r, `${radius[r]}px`]),
        ),
      },
    },
    plugins: [],
  };
}

/** Renders global.css from tokens — the checked-in src/global.css is this output. */
export function renderGlobalCss(): string {
  const vars = (scheme: ColorScheme) =>
    (Object.keys(cssVarNames) as (keyof ColorScheme)[])
      .map((token) => `  ${cssVarNames[token]}: ${scheme[token]};`)
      .join("\n");

  return `/* GENERATED from packages/ui/src/tokens.ts — do not edit by hand.
   Regenerate: pnpm --filter @moments/ui run gen:css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
${vars(lightColors)}
}

.dark {
${vars(darkColors)}
}
`;
}
