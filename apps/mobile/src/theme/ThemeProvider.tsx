import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { MMKV } from "react-native-mmkv";
import type { ThemeMode } from "@moments/ui";

const storage = new MMKV({ id: "moments-theme" });
const PREFERENCE_KEY = "theme-mode";

export interface ThemeContextValue {
  /** User preference: follow system, force dark, or force light. */
  preference: ThemeMode;
  /** Resolved scheme actually rendered. */
  scheme: "dark" | "light";
  setPreference: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(preference: ThemeMode, system: "dark" | "light" | null | undefined): "dark" | "light" {
  if (preference === "system") return system === "dark" ? "dark" : "light";
  return preference;
}

/**
 * ThemeProvider (F2.2 / KAN-105): system/dark/light with MMKV persistence —
 * the preference survives app restarts (epic KAN-5 acceptance). The resolved
 * scheme toggles the `dark` class that swaps the token CSS variables in
 * global.css.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemeMode>(() => {
    const stored = storage.getString(PREFERENCE_KEY);
    return stored === "system" || stored === "dark" || stored === "light" ? stored : "system";
  });

  useEffect(() => {
    // Persist so the choice survives restarts; default follows the system.
    storage.set(PREFERENCE_KEY, preference);
  }, [preference]);

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

/** Test seam for the scheme resolution logic. */
export const __themeInternals = { resolveScheme };
