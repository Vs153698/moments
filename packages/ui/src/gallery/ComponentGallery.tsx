import React from "react";
import { ScrollView, Text, View } from "react-native";
import {
  AvatarStack,
  BadgeTier,
  BottomSheet,
  Button,
  ChatBubble,
  Chip,
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
  SkeletonRow,
  StatBlock,
  TextInput,
  Toast,
  UserRow,
} from "../components/index";
import { useTheme } from "../theme";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-base font-semibold text-text">{title}</Text>
      {children}
    </View>
  );
}

/**
 * /dev/components gallery (F3.3 / KAN-108): renders every component variant.
 * Mount inside a ThemeProvider; the host screen applies the `dark` class per
 * scheme so both themes can be eyeballed (and are covered by the render tests).
 */
export function ComponentGallery() {
  const { scheme } = useTheme();
  const [tab, setTab] = React.useState<"Upcoming" | "Live" | "Past">("Upcoming");
  const [otp, setOtp] = React.useState("12");
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-5">
      <Text className="text-2xl font-bold text-text">/dev/components — {scheme} theme</Text>

      <Section title="Button">
        <Button label="Primary" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Ghost" variant="ghost" />
        <Button label="Danger" variant="danger" />
        <Button label="Loading" loading />
        <Button label="Disabled" disabled />
        <Button label="Small" size="sm" block={false} />
      </Section>

      <Section title="Chip">
        <View className="flex-row gap-2 flex-wrap">
          <Chip label="Hangout" selected />
          <Chip label="Event" />
          <Chip label="Trip" leading="✈️" />
        </View>
      </Section>

      <Section title="SegmentedTabs">
        <SegmentedTabs options={["Upcoming", "Live", "Past"] as const} value={tab} onChange={setTab} />
      </Section>

      <Section title="ListRow">
        <ListRow title="Notifications" subtitle="Push, mentions and invites" right={<Text className="text-text-muted">›</Text>} />
        <ListRow title="Privacy" onPress={() => {}} />
      </Section>

      <Section title="TextInput">
        <TextInput label="Display name" placeholder="Asha Verma" />
        <TextInput label="Phone" error="Enter a valid number" leading="+91" />
      </Section>

      <Section title="OtpInput">
        <OtpInput value={otp} onChange={setOtp} />
        <OtpInput value="12" onChange={() => {}} error />
      </Section>

      <Section title="Toast">
        <Toast message="Moment created" variant="success" visible />
        <Toast message="Upload failed" variant="error" visible actionLabel="Retry" />
        <Toast message="Link copied" visible={false} />
      </Section>

      <Section title="Skeleton">
        <SkeletonRow />
        <Skeleton width={120} height={16} />
      </Section>

      <Section title="EmptyState / ErrorView">
        <EmptyState title="No moments yet" message="Create your first moment to see it here." actionLabel="Create" />
        <ErrorView onRetry={() => {}} />
      </Section>

      <Section title="MomentCard">
        <MomentCard
          title="Sunset chai at Marine Drive"
          location="Marine Drive, Mumbai"
          startsAt="Today 6:30 PM"
          participants={["Asha", "Rohan", "Meera"]}
          participantCount={24}
          live
        />
        <MomentCard variant="compact" title="Board games night" location="Koramangala" live />
        <View className="bg-surface rounded-lg py-3">
          <MomentCard variant="map" title="Football at Turf 7" location="Turf 7" live />
        </View>
        <MomentCard variant="row" title="Weekend trek to Lohagad" startsAt="Sat 7:00 AM" />
      </Section>

      <Section title="LiveBadge / AvatarStack / StatBlock">
        <LiveBadge />
        <AvatarStack names={["Asha Verma", "Rohan Mehta", "Meera Iyer", "Dev Shah", "Kabir Nair"]} />
        <View className="flex-row gap-6">
          <StatBlock value={24} label="joined" />
          <StatBlock value={132} label="media" />
          <StatBlock value="2.4k" label="views" compact />
        </View>
      </Section>

      <Section title="MediaTile / UserRow / BadgeTier / MapPin / Fab">
        <View className="flex-row gap-2">
          <MediaTile label="Empty placeholder tile" />
          <MediaTile overflowCount={12} />
        </View>
        <UserRow name="Asha Verma" handle="@asha" meta="Host" actionLabel="Follow" />
        <View className="flex-row gap-2">
          <BadgeTier tier="new" />
          <BadgeTier tier="rising" />
          <BadgeTier tier="core" />
          <BadgeTier tier="legend" />
        </View>
        <MapPin label="Bandra West" active />
        <Fab onPress={() => setSheetOpen(true)} />
      </Section>

      <Section title="ChatBubble">
        <ChatBubble mine message="On my way!" time="6:24 PM" status="read" />
        <ChatBubble message="Gate 4 works?" time="6:25 PM" senderName="Rohan" />
        <ChatBubble mine message="See you there" time="6:26 PM" status="failed" />
      </Section>

      <Section title="BottomSheet">
        <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
      </Section>

      <BottomSheet visible={sheetOpen} title="Example sheet" onClose={() => setSheetOpen(false)}>
        <Text className="text-base text-text">Sheet content in both themes.</Text>
        <Button label="Close" onPress={() => setSheetOpen(false)} />
      </BottomSheet>
    </ScrollView>
  );
}
