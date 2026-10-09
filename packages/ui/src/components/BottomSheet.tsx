import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View, type GestureResponderEvent } from "react-native";

export interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Modal bottom sheet with slide-up animation (F3.3 / KAN-108).
 * Simple, dependency-free; drag-to-dismiss lands with the gesture work in E06/E10.
 */
export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(300);
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, translateY]);

  const handleBackdropPress = (_e: GestureResponderEvent) => onClose();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-background/50">
        <Pressable accessibilityLabel="Close sheet" className="absolute inset-0" onPress={handleBackdropPress} />
        <Animated.View
          className="bg-surface rounded-t-3xl p-4 gap-3"
          style={{ transform: [{ translateY }] }}
        >
          <View className="w-10 h-1 rounded-full bg-border self-center" />
          {title ? <Text className="text-lg font-semibold text-text">{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
