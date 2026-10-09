import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { AvatarStack } from "./AvatarStack";
import { LiveBadge } from "./LiveBadge";
import { MapPin } from "./MapPin";

export type MomentCardVariant = "hero" | "compact" | "map" | "row";

export interface MomentCardProps {
  variant?: MomentCardVariant;
  title: string;
  location?: string;
  startsAt?: string;
  coverUri?: string;
  hostName?: string;
  participants?: string[];
  participantCount?: number;
  live?: boolean;
  onPress?: () => void;
}

function Meta({
  location,
  startsAt,
  muted = false,
}: {
  location?: string;
  startsAt?: string;
  muted?: boolean;
}) {
  const line = [location ? `📍 ${location}` : null, startsAt].filter(Boolean).join("  ·  ");
  if (!line) return null;
  return (
    <Text className={`text-xs ${muted ? "text-text-muted" : "text-on-primary/80"}`} numberOfLines={1}>
      {line}
    </Text>
  );
}

function HeroCard({ title, location, startsAt, coverUri, hostName, participants, participantCount, live, onPress }: MomentCardProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: "button" as const } : {})}
      accessibilityLabel={title}
      className="rounded-xl overflow-hidden bg-surface"
    >
      <View className="h-40 bg-surface-alt">
        {coverUri ? <Image source={{ uri: coverUri }} className="w-full h-full" accessibilityLabel={`${title} cover`} /> : null}
        <View className="absolute top-2 left-2">{live ? <LiveBadge /> : null}</View>
      </View>
      <View className="p-3 gap-1">
        <Text className="text-lg font-bold text-text" numberOfLines={1}>
          {title}
        </Text>
        <Meta location={location} startsAt={startsAt} muted />
        <View className="flex-row items-center justify-between mt-1">
          <AvatarStack names={participants ?? (hostName ? [hostName] : [])} />
          {typeof participantCount === "number" ? (
            <Text className="text-xs text-text-muted">{participantCount} joined</Text>
          ) : null}
        </View>
      </View>
    </Wrapper>
  );
}

function CompactCard(props: MomentCardProps) {
  const { title, location, startsAt, live, onPress } = props;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: "button" as const } : {})}
      accessibilityLabel={title}
      className="w-44 rounded-lg bg-surface p-3 gap-1 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        {live ? <LiveBadge compact /> : <View />}
        <Text className="text-xs text-text-muted" numberOfLines={1}>
          {startsAt ?? ""}
        </Text>
      </View>
      <Text className="text-base font-semibold text-text" numberOfLines={2}>
        {title}
      </Text>
      {location ? (
        <Text className="text-xs text-text-muted" numberOfLines={1}>
          📍 {location}
        </Text>
      ) : null}
    </Wrapper>
  );
}

function MapCard(props: MomentCardProps) {
  const { title, location, live, onPress } = props;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: "button" as const } : {})}
      accessibilityLabel={title}
      className="w-40 items-center gap-1.5 active:opacity-80"
    >
      <MapPin label={location ?? title} active={live} />
      <Text className="text-xs font-medium text-text text-center" numberOfLines={1}>
        {title}
      </Text>
    </Wrapper>
  );
}

function RowCard(props: MomentCardProps) {
  const { title, location, startsAt, coverUri, live, onPress } = props;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, accessibilityRole: "button" as const } : {})}
      accessibilityLabel={title}
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-surface"
    >
      <View className="w-12 h-12 rounded-md bg-surface-alt overflow-hidden">
        {coverUri ? <Image source={{ uri: coverUri }} className="w-full h-full" /> : null}
        {live ? (
          <View className="absolute bottom-0.5 left-0.5">
            <LiveBadge compact />
          </View>
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-text" numberOfLines={1}>
          {title}
        </Text>
        <Meta location={location} startsAt={startsAt} muted />
      </View>
    </Wrapper>
  );
}

/** Moment card with hero / compact / map / row layouts (F3.2 / KAN-107). */
export function MomentCard(props: MomentCardProps) {
  switch (props.variant ?? "hero") {
    case "compact":
      return <CompactCard {...props} />;
    case "map":
      return <MapCard {...props} />;
    case "row":
      return <RowCard {...props} />;
    default:
      return <HeroCard {...props} />;
  }
}
