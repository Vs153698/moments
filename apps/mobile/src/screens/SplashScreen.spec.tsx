import React, { type ReactElement } from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SplashScreen } from "./SplashScreen";

function render(ui: ReactElement): ReactTestInstance {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer.root;
}

function textContent(node: ReactTestInstance): string {
  const parts: string[] = [];
  const walk = (n: ReactTestInstance) => {
    if (typeof n.children[0] === "string") parts.push(n.children.join(""));
    n.children.forEach((c) => {
      if (typeof c === "object" && c !== null) walk(c as ReactTestInstance);
    });
  };
  walk(node);
  return parts.join("");
}

function byLabel(root: ReactTestInstance, label: string): ReactTestInstance[] {
  // only host elements — the RN stub's function components mirror the same props
  return root.findAll(
    (n) => typeof n.type === "string" && (n.props as Record<string, unknown>).accessibilityLabel === label,
  );
}

const noop = () => {};

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    onCreateAccount: noop,
    onContinueWithGoogle: noop,
    onContinueWithApple: noop,
    onSignIn: noop,
    ...overrides,
  };
}

describe("S1 Splash screen (KAN-114)", () => {
  it.each(["dark", "light"] as const)("renders wordmark, tagline and all entry points in %s theme", (theme) => {
    const root = render(<SplashScreen {...makeProps({ theme })} />);

    expect(textContent(root)).toContain("MOMENTS");
    expect(textContent(root)).toContain("Every plan becomes a memory.");

    // every entry point is present and labelled (iOS per the test stub)
    for (const label of [
      "Create Account",
      "Continue with Google",
      "Continue with Apple",
      "Already have an account? Sign in",
    ]) {
      expect(byLabel(root, label).length).toBeGreaterThan(0);
    }

    // themed hero bundled per theme
    const hero = root.findByType("ImageBackground" as never);
    expect((hero.props as Record<string, unknown>).accessibilityLabel).toBe(`Splash hero (${theme} theme)`);
  });

  it("wires every entry point to its handler", () => {
    const onCreateAccount = vi.fn();
    const onContinueWithGoogle = vi.fn();
    const onContinueWithApple = vi.fn();
    const onSignIn = vi.fn();
    const root = render(
      <SplashScreen {...makeProps({ onCreateAccount, onContinueWithGoogle, onContinueWithApple, onSignIn })} />,
    );

    for (const [label, handler] of [
      ["Create Account", onCreateAccount],
      ["Continue with Google", onContinueWithGoogle],
      ["Continue with Apple", onContinueWithApple],
      ["Already have an account? Sign in", onSignIn],
    ] as const) {
      const target = byLabel(root, label)[0];
      if (!target) throw new Error(`no element labelled ${label}`);
      act(() => (target.props as { onPress: () => void }).onPress());
      expect(handler).toHaveBeenCalledTimes(1);
    }
  });
});
