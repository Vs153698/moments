import React, { type ReactElement } from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ONBOARDING_SLIDES, OnboardingScreen } from "./OnboardingScreen";

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

function press(root: ReactTestInstance, label: string) {
  const target = byLabel(root, label)[0];
  if (!target) throw new Error(`no element labelled ${label}`);
  act(() => (target.props as { onPress: () => void }).onPress());
}

/** 1-based index of the carousel dot marked selected, 0 when none. */
function selectedDot(root: ReactTestInstance): number {
  const dot = root.findAll((n) => {
    const props = n.props as { accessibilityLabel?: string; accessibilityState?: { selected?: boolean } };
    return typeof n.type === "string" && props.accessibilityState?.selected === true;
  })[0];
  if (!dot) return 0;
  const label = (dot.props as Record<string, unknown>).accessibilityLabel as string;
  return Number(label.match(/Slide (\d) of/)?.[1] ?? 0);
}

describe("S2 Onboarding carousel (KAN-115)", () => {
  it("shows the three spec slides in order with Next advancing to Get started", () => {
    const onDone = vi.fn();
    const root = render(<OnboardingScreen onDone={onDone} />);

    expect(ONBOARDING_SLIDES.map((s) => s.title)).toEqual([
      "Discover",
      "Join and contribute",
      "Relive as a memory",
    ]);

    // slide 1
    expect(textContent(root)).toContain("Discover");
    expect(textContent(root)).toContain("Find moments happening around you");
    expect(selectedDot(root)).toBe(1);
    expect(byLabel(root, "Next").length).toBe(1);

    press(root, "Next");
    expect(textContent(root)).toContain("Join and contribute");
    expect(selectedDot(root)).toBe(2);

    press(root, "Next");
    expect(textContent(root)).toContain("Relive as a memory");
    expect(byLabel(root, "Get started").length).toBe(1);
    expect(byLabel(root, "Next").length).toBe(0);
  });

  it("Get started completes the carousel (not a skip)", () => {
    const onDone = vi.fn();
    const root = render(<OnboardingScreen onDone={onDone} />);
    press(root, "Next");
    press(root, "Next");
    press(root, "Get started");
    expect(onDone).toHaveBeenCalledWith(false);
  });

  it("Skip completes from any slide", () => {
    const onDone = vi.fn();
    const root = render(<OnboardingScreen onDone={onDone} />);
    press(root, "Next");
    press(root, "Skip");
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it("marks progress accessibly on every slide", () => {
    const root = render(<OnboardingScreen onDone={() => {}} />);
    for (let i = 1; i <= ONBOARDING_SLIDES.length; i += 1) {
      expect(byLabel(root, `Slide ${i} of 3`).length).toBe(1);
      expect(selectedDot(root)).toBe(i);
      if (i < ONBOARDING_SLIDES.length) press(root, "Next");
    }
  });
});
