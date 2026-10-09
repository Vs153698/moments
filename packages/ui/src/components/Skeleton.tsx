import React from "react";
import { View } from "react-native";

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Render a rounded avatar-style block. */
  circle?: boolean;
}

/** Loading placeholder block (F3.1 / KAN-106). */
export function Skeleton({ width = "100%", height = 16, circle = false }: SkeletonProps) {
  return (
    <View
      className="bg-surface-alt"
      style={{ width, height, borderRadius: circle ? height / 2 : 6 }}
    />
  );
}

/** Common list-loading composition: avatar line + two text lines. */
export function SkeletonRow() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Skeleton circle width={40} height={40} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}
