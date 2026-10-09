/**
 * Theme context core (F2.2 / KAN-105, moved from apps/mobile so packages/ui
 * components and their tests can share one theme context).
 *
 * Persistence is injected: the app passes an MMKV-backed storage adapter,
 * tests (and any non-native surface) pass nothing and get in-memory state.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import type { ThemeMode } from "./tokens";

export type ResolvedScheme = "dark" | "light";

export interface ThemeStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

export interface ThemeContextValue {
  /** User preference: follow system, force dark, or force light. */
  preference: ThemeMode;
  /** Resolved scheme actually rendered. */
  scheme: ResolvedScheme;
  setPreference: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_PREFERENCE_KEY = "theme-mode";

export function resolveScheme(
  preference: ThemeMode,
  system: ResolvedScheme | null | undefined,
): ResolvedScheme {
  if (preference === "system") return system === "dark" ? "dark" : "light";
  return preference;
}

/** In-memory fallback when no storage adapter is provided (tests, web). */
const memoryStorage = (() => {
  const map = new Map<string, string>();
  return {
    getString: (key: string) => map.get(key),
    set: (key: string, value: string) => void map.set(key, value),
  } satisfies ThemeStorage;
})();

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Persist preference across restarts (MMKV in the app; omit in tests). */
  storage?: ThemeStorage;
}

export function ThemeProvider({ children, storage }: ThemeProviderProps) {
  const system = useColorScheme();
  const store = storage ?? memoryStorage;
  const [preference, setPreferenceState] = useState<ThemeMode>(() => {
    const stored = store.getString(THEME_PREFERENCE_KEY);
    return stored === "system" || stored === "dark" || stored === "light" ? stored : "system";
  });

  useEffect(() => {
    store.set(THEME_PREFERENCE_KEY, preference);
  }, [preference, store]);

  const setPreference = useCallback((mode: ThemeMode) => setPreferenceState(mode), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, scheme: resolveScheme(preference, system), setPreference }),
    [preference, system, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
