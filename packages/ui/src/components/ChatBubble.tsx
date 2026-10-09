import React from "react";
import { Text, View } from "react-native";

export type ChatBubbleStatus = "sent" | "delivered" | "read" | "failed";

export interface ChatBubbleProps {
  /** Outgoing (mine) vs incoming. */
  mine?: boolean;
  message: string;
  time?: string;
  status?: ChatBubbleStatus;
  senderName?: string;
}

const statusGlyphs: Record<ChatBubbleStatus, string> = {
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓",
  failed: "!",
};

/** Chat message bubble (F3.3 / KAN-108). */
export function ChatBubble({ mine = false, message, time, status, senderName }: ChatBubbleProps) {
  return (
    <View className={`px-3 ${mine ? "items-end" : "items-start"}`}>
      {!mine && senderName ? (
        <Text className="text-xs text-text-muted mb-0.5">{senderName}</Text>
      ) : null}
      <View
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          mine ? "bg-primary rounded-br-sm" : "bg-surface rounded-bl-sm"
        }`}
      >
        <Text className={`text-base ${mine ? "text-on-primary" : "text-text"}`}>{message}</Text>
        {time || status ? (
          <View className="flex-row items-center justify-end gap-1 mt-1">
            {time ? (
              <Text className={`text-[10px] ${mine ? "text-on-primary/70" : "text-text-muted"}`}>
                {time}
              </Text>
            ) : null}
            {status && mine ? (
              <Text
                accessibilityLabel={`Message ${status}`}
                className={`text-[10px] font-semibold ${
                  status === "failed" ? "text-on-primary" : "text-on-primary/70"
                }`}
              >
                {statusGlyphs[status]}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
