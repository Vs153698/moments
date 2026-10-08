const tseslint = require("typescript-eslint");
const boundaries = require("eslint-plugin-boundaries");

/**
 * Shared ESLint flat config for the Moments monorepo, including import
 * boundaries: apps may depend on packages, packages must stay acyclic and
 * never depend on apps (spec section 7).
 */
module.exports = tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "apps/*", capture: ["app"] },
        { type: "package", pattern: "packages/*", capture: ["package"] },
      ],
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "app",
              allow: [["package"], ["app", { app: "*" }]],
            },
            {
              from: "package",
              disallow: [["app"]],
              message: "packages must not import from apps/*",
            },
          ],
        },
      ],
    },
  },
);
