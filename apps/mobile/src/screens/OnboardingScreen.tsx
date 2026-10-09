import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Button } from "@moments/ui";
import discoverArt from "../../assets/onboarding-discover.png";
import joinArt from "../../assets/onboarding-join.png";
import reliveArt from "../../assets/onboarding-relive.png";

export interface OnboardingSlide {
  key: string;
  title: string;
  body: string;
  art: { uri: string };
}

/** S2 slides in spec order (KAN-115). Exported for tests and the dev gallery. */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: "discover",
    title: "Discover",
    body: "Find moments happening around you — trips, concerts, hangouts, celebrations.",
    art: discoverArt,
  },
  {
    key: "join",
    title: "Join and contribute",
    body: "Add photos, videos and polls to moments you are part of, as they happen.",
    art: joinArt,
  },
  {
    key: "relive",
    title: "Relive as a memory",
    body: "When the moment ends, it becomes a shared memory timeline for everyone.",
    art: reliveArt,
  },
];

export interface OnboardingScreenProps {
  /** Called when the user finishes (skipped=false) or skips (skipped=true). */
  onDone: (skipped: boolean) => void;
}

/**
 * S2 Onboarding carousel (spec 5 screen 2 / KAN-115): three slides with
 * Next / Get started and Skip. First-run only — the route wrapper enforces
 * "never shown twice" via hasCompletedOnboarding().
 */
export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[index]!; // index is state-bounded to the slide array
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  return (
    <View className="flex-1 bg-background px-6 pb-10 pt-16">
      <View className="flex-row items-center justify-between">
        <View className="w-12" />
        <Pressable
          onPress={() => onDone(true)}
          accessibilityRole="button"
          accessibilityLabel="Skip"
          hitSlop={8}
        >
          <Text className="text-base font-semibold text-text-secondary">Skip</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center">
        <Image
          source={slide.art}
          accessibilityLabel={`${slide.title} illustration`}
          className="h-64 w-64"
          resizeMode="contain"
        />
        <Text className="mt-8 text-3xl font-bold text-text">{slide.title}</Text>
        <Text className="mt-3 text-center text-base leading-6 text-text-secondary">{slide.body}</Text>
      </View>

      <View className="gap-5">
        <View className="flex-row justify-center gap-2" accessibilityLabel="Progress">
          {ONBOARDING_SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={`h-2 rounded-full ${i === index ? "w-6 bg-primary" : "w-2 bg-surface-alt"}`}
              accessibilityLabel={`Slide ${i + 1} of ${ONBOARDING_SLIDES.length}`}
              accessibilityState={{ selected: i === index }}
            />
          ))}
        </View>
        <Button
          label={isLast ? "Get started" : "Next"}
          size="lg"
          onPress={() => (isLast ? onDone(false) : setIndex(index + 1))}
          accessibilityLabel={isLast ? "Get started" : "Next"}
        />
      </View>
    </View>
  );
}
