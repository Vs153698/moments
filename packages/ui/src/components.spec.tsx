import React, { type ReactElement } from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import {
  AvatarStack,
  BadgeTier,
  Button,
  ChatBubble,
  Chip,
  ComponentGallery,
  EmptyState,
  ErrorView,
  Fab,
  ListRow,
  LiveBadge,
  MapPin,
  MediaTile,
  MomentCard,
  OtpInput,
  SegmentedTabs,
  Skeleton,
  StatBlock,
  TextInput,
  ThemeProvider,
  Toast,
  UserRow,
  type ThemeStorage,
} from "./index";

/**
 * Component tests in dark AND light (KAN-108). React Native ships Flow-typed
 * source that vitest cannot parse, so these render against the host-element
 * stub (see testing/react-native-stub.tsx) via react-test-renderer, with
 * tiny query helpers instead of @testing-library/react-native.
 */

function storageWith(mode: string): ThemeStorage {
  const map = new Map<string, string>([["theme-mode", mode]]);
  return { getString: (k) => map.get(k), set: (k, v) => void map.set(k, v) };
}

function renderIn(ui: ReactElement, mode: "dark" | "light"): ReactTestInstance {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider storage={storageWith(mode)}>{ui}</ThemeProvider>,
    );
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

function byText(root: ReactTestInstance, text: string): ReactTestInstance[] {
  return root.findAll(
    (n) =>
      (n.type as string) === "Text" && textContent(n).includes(text),
  );
}

function byLabel(root: ReactTestInstance, label: string): ReactTestInstance[] {
  return root.findAll((n) => (n.props as Record<string, unknown>).accessibilityLabel === label);
}

function byRoleName(root: ReactTestInstance, role: string, name: string): ReactTestInstance[] {
  return root.findAll(
    (n) =>
      (n.props as Record<string, unknown>).accessibilityRole === role && textContent(n) === name,
  );
}

describe.each(["dark", "light"] as const)("components render in %s theme (KAN-108)", (mode) => {
  it("primitives (F3.1)", () => {
    const root = renderIn(
      <>
        <Button label="Press me" onPress={() => {}} />
        <Chip label="Hangout" selected />
        <SegmentedTabs options={["A", "B"] as const} value="A" onChange={() => {}} />
        <ListRow title="Notifications" subtitle="Push and invites" />
        <TextInput label="Name" />
        <OtpInput value="123" onChange={() => {}} />
        <Toast message="Saved" variant="success" visible />
        <Skeleton width={40} height={8} />
        <EmptyState title="Nothing here" />
        <ErrorView onRetry={() => {}} />
      </>,
      mode,
    );
    expect(byText(root, "Press me").length).toBeGreaterThan(0);
    expect(byLabel(root, "Hangout").length).toBeGreaterThan(0);
    expect(byText(root, "Notifications").length).toBeGreaterThan(0);
    expect(byText(root, "Saved").length).toBeGreaterThan(0);
    expect(byText(root, "Nothing here").length).toBeGreaterThan(0);
    expect(byText(root, "Hidden toast")).toHaveLength(0);
  });

  it("moment components (F3.2)", () => {
    const root = renderIn(
      <>
        <MomentCard title="Sunset chai" location="Marine Drive" live participants={["Asha"]} />
        <MomentCard variant="compact" title="Game night" />
        <MomentCard variant="map" title="Turf 7" />
        <MomentCard variant="row" title="Trek" startsAt="Sat" />
        <LiveBadge />
        <AvatarStack names={["Asha Verma", "Rohan Mehta"]} />
        <StatBlock value={24} label="joined" />
        <MediaTile overflowCount={3} />
        <UserRow name="Meera Iyer" handle="@meera" />
        <BadgeTier tier="legend" />
        <MapPin label="Bandra West" active />
        <Fab onPress={() => {}} />
      </>,
      mode,
    );
    expect(byText(root, "Sunset chai").length).toBeGreaterThan(0);
    expect(byText(root, "Game night").length).toBeGreaterThan(0);
    expect(byLabel(root, "LIVE").length).toBeGreaterThan(0);
    expect(byLabel(root, "2 participants").length).toBeGreaterThan(0);
    expect(byText(root, "Legend").length).toBeGreaterThan(0);
    expect(byLabel(root, "Create moment").length).toBeGreaterThan(0);
  });

  it("chat bubbles (F3.3)", () => {
    const root = renderIn(
      <>
        <ChatBubble mine message="On my way" time="6:24 PM" status="read" />
        <ChatBubble message="Gate 4?" senderName="Rohan" />
      </>,
      mode,
    );
    expect(byText(root, "On my way").length).toBeGreaterThan(0);
    expect(byText(root, "Gate 4?").length).toBeGreaterThan(0);
  });

  it("full gallery renders", () => {
    const root = renderIn(<ComponentGallery />, mode);
    expect(byText(root, `/dev/components — ${mode} theme`).length).toBeGreaterThan(0);
  });
});

describe("behaviour", () => {
  it("Button calls onPress when enabled, not when disabled", () => {
    let pressed = 0;
    const root = renderIn(
      <>
        <Button label="Go" onPress={() => pressed++} />
        <Button label="Stop" disabled onPress={() => pressed++} />
      </>,
      "light",
    );
    const go = byLabel(root, "Go")[0]!;
    const stop = byLabel(root, "Stop")[0]!;
    act(() => {
      (go.props as { onPress?: () => void }).onPress?.();
      (stop.props as { onPress?: () => void }).onPress?.();
    });
    expect(pressed).toBe(1);
  });

  it("SegmentedTabs reports the selected option", () => {
    let chosen = "";
    const root = renderIn(
      <SegmentedTabs
        options={["Upcoming", "Past"] as const}
        value="Upcoming"
        onChange={(v) => (chosen = v)}
      />,
      "dark",
    );
    const past = byRoleName(root, "tab", "Past")[0]!;
    act(() => {
      (past.props as { onPress?: () => void }).onPress?.();
    });
    expect(chosen).toBe("Past");
  });

  it("OtpInput renders one box per digit", () => {
    const root = renderIn(<OtpInput length={6} value="123" onChange={() => {}} />, "light");
    const boxes = (id: string) =>
      root.findAll(
        (n) =>
          (n.type as string) === "TextInput" &&
          (n.props as { testID?: string }).testID === id,
      );
    expect(boxes("otp-box-0").length).toBe(1);
    expect(boxes("otp-box-5").length).toBe(1);
  });

  it("theme preference persists through the storage adapter", () => {
    const store = new Map<string, string>();
    const storage: ThemeStorage = { getString: (k) => store.get(k), set: (k, v) => void store.set(k, v) };
    act(() => {
      TestRenderer.create(
        <ThemeProvider storage={storage}>
          <Button label="noop" />
        </ThemeProvider>,
      );
    });
    // No stored preference → defaults to system, and the choice is written back.
    expect(store.get("theme-mode")).toBe("system");
  });
});
