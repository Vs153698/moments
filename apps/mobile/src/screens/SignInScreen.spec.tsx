import React, { type ReactElement } from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SignInScreen } from "./SignInScreen";

function render(ui: ReactElement): ReactTestInstance {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer.root;
}

function byLabel(root: ReactTestInstance, label: string): ReactTestInstance[] {
  return root.findAll(
    (n) => typeof n.type === "string" && (n.props as Record<string, unknown>).accessibilityLabel === label,
  );
}

function byLabelStrict(root: ReactTestInstance, label: string): ReactTestInstance {
  const matches = byLabel(root, label);
  if (matches.length === 0) throw new Error(`no element labelled ${label}`);
  return matches[0]!;
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

const noop = () => Promise.resolve();

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    onContinueWithGoogle: noop,
    onContinueWithApple: noop,
    onSendOtp: noop,
    ...overrides,
  };
}

describe("S2a Sign in / Sign up screen (KAN-33)", () => {
  it("renders Google, Apple, phone entry, OTP button and terms footer", () => {
    const root = render(<SignInScreen {...makeProps()} />);

    expect(textContent(root)).toContain("Get started");
    expect(textContent(root)).toContain("Sign up or sign in to continue.");

    for (const label of ["Continue with Google", "Continue with Apple", "Mobile number", "Send OTP"]) {
      expect(byLabel(root, label).length).toBeGreaterThan(0);
    }

    expect(textContent(root)).toContain("Terms of Service");
    expect(textContent(root)).toContain("Privacy Policy");
    expect(textContent(root)).toContain("DPDP notice");
  });

  it("sends OTP only when a valid 10-digit Indian number is entered", async () => {
    const onSendOtp = vi.fn().mockResolvedValue(undefined);
    const root = render(<SignInScreen {...makeProps({ onSendOtp })} />);

    const input = byLabelStrict(root, "Mobile number");
    const send = byLabelStrict(root, "Send OTP");

    // Too short
    act(() => (input.props as { onChangeText: (t: string) => void }).onChangeText("98765"));
    await act(async () => (send.props as { onPress: () => void }).onPress());
    expect(onSendOtp).not.toHaveBeenCalled();
    expect(textContent(root)).toContain("Enter a valid 10-digit Indian mobile number");

    // Invalid start digit
    act(() => (input.props as { onChangeText: (t: string) => void }).onChangeText("5876543210"));
    await act(async () => (send.props as { onPress: () => void }).onPress());
    expect(onSendOtp).not.toHaveBeenCalled();

    // Valid
    act(() => (input.props as { onChangeText: (t: string) => void }).onChangeText("9876543210"));
    await act(async () => (send.props as { onPress: () => void }).onPress());
    expect(onSendOtp).toHaveBeenCalledWith("+919876543210");
  });

  it("wires Google and Apple handlers", async () => {
    const onContinueWithGoogle = vi.fn().mockResolvedValue(undefined);
    const onContinueWithApple = vi.fn().mockResolvedValue(undefined);
    const root = render(
      <SignInScreen {...makeProps({ onContinueWithGoogle, onContinueWithApple })} />,
    );

    await act(async () => (byLabelStrict(root, "Continue with Google").props as { onPress: () => void }).onPress());
    expect(onContinueWithGoogle).toHaveBeenCalledTimes(1);

    await act(async () => (byLabelStrict(root, "Continue with Apple").props as { onPress: () => void }).onPress());
    expect(onContinueWithApple).toHaveBeenCalledTimes(1);
  });

  it("disables all actions while a provider is loading", () => {
    const onContinueWithGoogle = vi.fn().mockResolvedValue(undefined);
    const onContinueWithApple = vi.fn().mockResolvedValue(undefined);
    const onSendOtp = vi.fn().mockResolvedValue(undefined);
    const root = render(
      <SignInScreen
        {...makeProps({ onContinueWithGoogle, onContinueWithApple, onSendOtp })}
        loadingProvider="phone"
      />,
    );

    const google = byLabelStrict(root, "Continue with Google");
    const apple = byLabelStrict(root, "Continue with Apple");
    const send = byLabelStrict(root, "Send OTP");

    for (const el of [google, apple, send]) {
      expect((el.props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled).toBe(true);
    }
  });

  it("shows an error toast when an error is provided", () => {
    const root = render(<SignInScreen {...makeProps()} error="Rate limited. Try again later." />);
    expect(textContent(root)).toContain("Rate limited. Try again later.");
  });
});
