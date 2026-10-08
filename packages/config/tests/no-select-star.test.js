import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import plugin from "../eslint-plugin-moments.js";

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

describe("@moments/no-select-star", () => {
  it("bans zero-arg select() on moments, allows explicit columns and other tables", () => {
    tester.run("no-select-star", plugin.rules["no-select-star"], {
      valid: [
        "db.select({ id: moments.id, title: moments.title }).from(moments);",
        "db.select().from(users);",
        "db.select({ id: users.id }).from(users).where(eq(users.id, 1));",
        "db.query.moments.findMany();",
      ],
      invalid: [
        {
          code: "db.select().from(moments);",
          errors: [{ messageId: "selectStar" }],
        },
        {
          code: "db.select().from(moments).where(eq(moments.status, 'live'));",
          errors: [{ messageId: "selectStar" }],
        },
      ],
    });
  });
});
