/**
 * Regenerates src/global.css from tokens. Run via
 * `pnpm --filter @moments/ui run gen:css`; tokens.spec.ts asserts the
 * checked-in file matches this output.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderGlobalCss } from "../src/tailwind";

const target = join(__dirname, "..", "src", "global.css");
writeFileSync(target, renderGlobalCss());
console.log(`wrote ${target}`);
