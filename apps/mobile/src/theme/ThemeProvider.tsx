import { MMKV } from "react-native-mmkv";
import { ThemeProvider as UiThemeProvider, type ThemeStorage } from "@moments/ui";

const mmkv = new MMKV({ id: "moments-theme" });

const storage: ThemeStorage = {
  getString: (key) => mmkv.getString(key),
  set: (key, value) => mmkv.set(key, value),
};

/**
 * App theme provider (F2.2 / KAN-105): the context lives in @moments/ui so
 * components and tests share it; this wrapper injects MMKV persistence so the
 * user's System/Dark/Light choice survives restarts (epic KAN-5 acceptance).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <UiThemeProvider storage={storage}>{children}</UiThemeProvider>
  );
}

export { useTheme } from "@moments/ui";
