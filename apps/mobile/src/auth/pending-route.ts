import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "moments-routing" });
const KEY = "pending-route";

/**
 * Deep-link carry-through (C2a.2 / KAN-115): when a signed-out user opens a
 * protected deep link, the auth gate remembers the intended destination and the
 * post-auth redirect restores it instead of dropping the user on Home.
 */
export function rememberPendingRoute(path: string): void {
  if (!path || path === "/" ) return;
  storage.set(KEY, path);
}

/** Returns the remembered route (if any) and clears it — one-shot. */
export function consumePendingRoute(): string | undefined {
  const path = storage.getString(KEY);
  if (path) storage.delete(KEY);
  return path;
}

/** Test/dev helper — not used by app code. */
export function clearPendingRouteForTests(): void {
  storage.delete(KEY);
}
