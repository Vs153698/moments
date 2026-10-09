import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const uiTesting = fileURLToPath(new URL("../../packages/ui/src/testing", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // RN ships Flow-typed source; tests render against the ui package's
      // host-element stub, same as the KAN-108 component tests.
      { find: "react-native", replacement: `${uiTesting}/react-native-stub.tsx` },
      { find: "react-native-mmkv", replacement: fileURLToPath(new URL("./src/testing/mmkv-stub.ts", import.meta.url)) },
    ],
  },
  test: {
    include: ["src/**/*.spec.{ts,tsx}"],
    environment: "node",
    setupFiles: ["src/testing/setup.ts"],
  },
});
