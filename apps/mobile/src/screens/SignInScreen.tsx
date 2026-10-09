import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Button, BottomSheet, TextInput, Toast } from "@moments/ui";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

function formatPhone(national: string): string {
  return `+91${national.replace(/\D/g, "").slice(-10)}`;
}

export interface SignInScreenProps {
  onContinueWithGoogle: () => Promise<void>;
  onContinueWithApple: () => Promise<void>;
  onSendOtp: (phone: string) => Promise<void>;
  loadingProvider?: "google" | "apple" | "phone" | null;
  error?: string | null;
  restoreSheetVisible?: boolean;
  onCloseRestoreSheet?: () => void;
  onRestoreAccount?: () => void;
}

/**
 * S2a Sign in / Sign up screen (KAN-33): one entry point for Google, Apple
 * (iOS), and phone-OTP auth. Phone numbers are normalised to Indian E.164.
 */
export function SignInScreen({
  onContinueWithGoogle,
  onContinueWithApple,
  onSendOtp,
  loadingProvider,
  error,
  restoreSheetVisible,
  onCloseRestoreSheet,
  onRestoreAccount,
}: SignInScreenProps) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const isBusy =
    loadingProvider === "google" || loadingProvider === "apple" || loadingProvider === "phone";

  const handleSendOtp = async () => {
    setPhoneError(null);
    const cleaned = phone.replace(/\D/g, "").slice(0, 10);
    if (!INDIAN_MOBILE.test(cleaned)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    await onSendOtp(formatPhone(cleaned));
  };

  return (
    <View className="flex-1 bg-background px-6 pb-8 pt-16">
      <View className="mb-8 gap-2">
        <Text className="text-3xl font-bold text-text">Get started</Text>
        <Text className="text-base text-text-muted">Sign up or sign in to continue.</Text>
      </View>

      <View className="gap-3">
        <Button
          label="Continue with Google"
          size="lg"
          variant="secondary"
          onPress={onContinueWithGoogle}
          loading={loadingProvider === "google"}
          disabled={isBusy}
          accessibilityLabel="Continue with Google"
        />
        {Platform.OS === "ios" && (
          <Button
            label="Continue with Apple"
            size="lg"
            variant="secondary"
            onPress={onContinueWithApple}
            loading={loadingProvider === "apple"}
            disabled={isBusy}
            accessibilityLabel="Continue with Apple"
          />
        )}
      </View>

      <View className="my-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-sm text-text-muted">or</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="gap-3">
        <TextInput
          label="Mobile number"
          leading="+91"
          placeholder="98765 43210"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(text) => {
            setPhone(text.replace(/\D/g, "").slice(0, 10));
            setPhoneError(null);
          }}
          error={phoneError ?? undefined}
          editable={!isBusy}
          accessibilityLabel="Mobile number"
        />
        <Button
          label="Send OTP"
          size="lg"
          onPress={handleSendOtp}
          loading={loadingProvider === "phone"}
          disabled={isBusy}
          accessibilityLabel="Send OTP"
        />
      </View>

      {error ? (
        <View className="mt-4">
          <Toast message={error} variant="error" visible />
        </View>
      ) : null}

      <View className="flex-1" />

      <Text className="text-center text-xs leading-5 text-text-muted">
        By continuing, you agree to our{" "}
        <Pressable accessibilityRole="link">
          <Text className="text-primary">Terms of Service</Text>
        </Pressable>{" "}
        and{" "}
        <Pressable accessibilityRole="link">
          <Text className="text-primary">Privacy Policy</Text>
        </Pressable>
        . Your data is processed per the{" "}
        <Pressable accessibilityRole="link">
          <Text className="text-primary">DPDP notice</Text>
        </Pressable>
        .
      </Text>

      <BottomSheet
        visible={restoreSheetVisible ?? false}
        title="Restore your account?"
        onClose={onCloseRestoreSheet ?? (() => {})}
      >
        <Text className="text-base text-text">
          This account is scheduled for deletion. You can restore it within the grace period.
        </Text>
        <Button
          label="Restore account"
          size="lg"
          onPress={onRestoreAccount ?? (() => {})}
          accessibilityLabel="Restore account"
        />
        <Button
          label="Cancel"
          size="lg"
          variant="ghost"
          onPress={onCloseRestoreSheet ?? (() => {})}
          accessibilityLabel="Cancel restore"
        />
      </BottomSheet>
    </View>
  );
}
