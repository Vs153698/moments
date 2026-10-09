import React, { type ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "./Button";

export interface EmptyStateProps {
  /** Large glyph or icon node shown above the title. */
  glyph?: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly empty-state block (F3.1 / KAN-106). */
export function EmptyState({ glyph, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 px-8 py-12">
      {glyph ? <View className="mb-2">{glyph}</View> : null}
      <Text className="text-lg font-semibold text-text text-center">{title}</Text>
      {message ? (
        <Text className="text-sm text-text-muted text-center">{message}</Text>
      ) : null}
      {actionLabel ? (
        <View className="mt-3 w-full">
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
