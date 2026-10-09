import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import plugin from "../eslint-plugin-moments.js";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

describe("@moments/no-hardcoded-hex (KAN-104)", () => {
  it("bans hex literals in component code, allows token source and allow-listed files", () => {
    tester.run("no-hardcoded-hex", plugin.rules["no-hardcoded-hex"], {
      valid: [
        {
          code: 'const color = tokens.primary;',
          filename: "apps/mobile/src/screens/Home.tsx",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$"] }],
        },
        {
          code: 'export const primary = "#6D5DF6";',
          filename: "packages/ui/src/tokens.ts",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$"] }],
        },
        {
          code: 'const c = "#fff";',
          filename: "packages/ui/src/tokens.spec.ts",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$", "\\.spec\\.ts$"] }],
        },
      ],
      invalid: [
        {
          code: 'const style = { color: "#FF0000" };',
          filename: "apps/mobile/src/screens/Home.tsx",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$"] }],
          errors: [{ messageId: "hardcodedHex" }],
        },
        {
          code: "const style = { color: `#FF0000` };",
          filename: "packages/ui/src/components/Button.tsx",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$"] }],
          errors: [{ messageId: "hardcodedHex" }],
        },
        {
          code: 'const border = "#dcdce4ff";',
          filename: "packages/ui/src/components/Card.tsx",
          options: [{ allow: ["packages/ui/src/tokens\\.ts$"] }],
          errors: [{ messageId: "hardcodedHex" }],
        },
      ],
    });
  });
});
