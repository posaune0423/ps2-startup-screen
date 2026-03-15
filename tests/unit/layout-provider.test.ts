import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const layoutSource = readFileSync(new URL("../../src/app/layout.tsx", import.meta.url), "utf8");

test("root layout wraps the app with LanguageProvider", () => {
  assert.match(layoutSource, /import \{ LanguageProvider \} from "\.\.\/lib\/language-context"/);
  assert.match(layoutSource, /<LanguageProvider>\{children\}<\/LanguageProvider>/);
});
