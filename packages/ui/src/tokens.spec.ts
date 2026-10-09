import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  darkColors,
  lightColors,
  radius,
  requiredBodyTextPairs,
  spacing,
  typography,
  type ColorScheme,
} from "./tokens";
import { contrastRatio } from "./contrast";
import { createTailwindConfig, renderGlobalCss } from "./tailwind";

describe("contrast (KAN-5 acceptance: body text ≥ 4.5:1 in both modes)", () => {
  const modes: [string, ColorScheme][] = [
    ["light", lightColors],
    ["dark", darkColors],
  ];
  for (const [mode, scheme] of modes) {
    for (const [fg, bg] of requiredBodyTextPairs) {
      it(`${mode}: ${fg} on ${bg}`, () => {
        expect(contrastRatio(scheme[fg], scheme[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("token scales (spec 3.1–3.3)", () => {
  it("spacing is strictly increasing and uses a 4pt grid", () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    for (const v of values) expect(v % 4).toBe(0);
  });

  it("type sizes are strictly increasing with matching line heights", () => {
    const sizes = Object.values(typography.sizes);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]!).toBeGreaterThan(sizes[i - 1]!);
    for (const key of Object.keys(typography.sizes) as (keyof typeof typography.sizes)[]) {
      expect(typography.lineHeights[key]).toBeGreaterThan(typography.sizes[key]);
    }
  });

  it("radius has a full-round option and no negative values", () => {
    expect(radius.full).toBe(9999);
    for (const v of Object.values(radius)) expect(v).toBeGreaterThanOrEqual(0);
  });

  it("light and dark schemes expose the same token set", () => {
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
  });
});

describe("generated artefacts", () => {
  it("tailwind config maps every colour token to its CSS var", () => {
    const config = createTailwindConfig();
    const colors = config.theme.extend.colors as Record<string, string>;
    for (const token of Object.keys(lightColors)) {
      expect(colors[token]).toBe(`var(--color-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`);
    }
  });

  it("checked-in global.css matches renderGlobalCss() (run gen:css if this fails)", () => {
    const onDisk = readFileSync(join(__dirname, "global.css"), "utf8");
    expect(onDisk).toBe(renderGlobalCss());
  });
});
