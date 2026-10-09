import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // RN ships Flow-typed source; tests render against a host-element stub.
      "react-native": fileURLToPath(new URL("./src/testing/react-native-stub.tsx", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.spec.{ts,tsx}"],
    environment: "node",
    setupFiles: ["src/testing/setup.ts"],
  },
});
