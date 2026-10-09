/**
 * Route manifest (F7.1 / KAN-109) — single source of truth for the app's
 * route tree. The dev menu renders from this list and routes.spec.ts asserts
 * the 22+ routes acceptance of epic KAN-5. Paths match the app/ file tree.
 */
export type RouteGroup = "auth" | "tabs" | "moment" | "chat" | "account" | "safety" | "dev";

export interface RouteInfo {
  /** expo-router path (href). */
  path: string;
  title: string;
  group: RouteGroup;
  /** Shown in the dev menu. */
  implemented: boolean;
}

export const ROUTES: RouteInfo[] = [
  // Auth (C1/C2 land here)
  { path: "/(auth)/splash", title: "Splash", group: "auth", implemented: true },
  { path: "/(auth)/onboarding", title: "Onboarding carousel", group: "auth", implemented: true },
  { path: "/(auth)/phone", title: "Sign in / Sign up", group: "auth", implemented: true },
  { path: "/(auth)/otp", title: "OTP verification", group: "auth", implemented: false },
  { path: "/(auth)/profile-setup", title: "Profile setup", group: "auth", implemented: false },
  { path: "/(auth)/support", title: "Support", group: "auth", implemented: true },
  // Tabs
  { path: "/(tabs)", title: "Home", group: "tabs", implemented: false },
  { path: "/(tabs)/explore", title: "Explore", group: "tabs", implemented: false },
  { path: "/(tabs)/map", title: "Nearby map", group: "tabs", implemented: false },
  { path: "/(tabs)/chats", title: "Chats", group: "tabs", implemented: false },
  { path: "/(tabs)/profile", title: "My profile", group: "tabs", implemented: false },
  // Moment lifecycle (E04–E09)
  { path: "/moment/create", title: "Create moment", group: "moment", implemented: false },
  { path: "/moment/[id]", title: "Moment detail", group: "moment", implemented: false },
  { path: "/moment/[id]/timeline", title: "Live timeline", group: "moment", implemented: false },
  { path: "/moment/[id]/chat", title: "Moment chat", group: "moment", implemented: false },
  { path: "/moment/[id]/gallery", title: "Media gallery", group: "moment", implemented: false },
  { path: "/moment/[id]/route", title: "Route & checkpoints", group: "moment", implemented: false },
  { path: "/moment/[id]/people", title: "Participants", group: "moment", implemented: false },
  { path: "/moment/[id]/edit", title: "Edit moment", group: "moment", implemented: false },
  // Chat (E10)
  { path: "/chat/[id]", title: "Direct message", group: "chat", implemented: false },
  // Account & notifications
  { path: "/notifications", title: "Notifications", group: "account", implemented: false },
  { path: "/user/[id]", title: "Public profile", group: "account", implemented: false },
  { path: "/settings", title: "Settings", group: "account", implemented: false },
  { path: "/settings/privacy", title: "Privacy settings", group: "account", implemented: false },
  { path: "/settings/blocked", title: "Blocked users", group: "account", implemented: false },
  // Safety (E16)
  { path: "/safety/report", title: "Report content", group: "safety", implemented: false },
  // Dev surfaces (this epic)
  { path: "/dev", title: "Dev menu", group: "dev", implemented: true },
  { path: "/dev/components", title: "/dev/components gallery", group: "dev", implemented: true },
  { path: "/dev/theme", title: "Theme tokens", group: "dev", implemented: true },
];

export const ROUTE_GROUPS: RouteGroup[] = ["auth", "tabs", "moment", "chat", "account", "safety", "dev"];
