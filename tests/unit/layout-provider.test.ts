import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const layoutSource = readFileSync(new URL("../../src/app/layout.tsx", import.meta.url), "utf8");

test("root layout wraps the app with LanguageProvider", () => {
  assert.match(layoutSource, /import \{ LanguageProvider \} from "\.\.\/lib\/language-context"/);
  assert.match(layoutSource, /<LanguageProvider>\{children\}<\/LanguageProvider>/);
});

test("root layout enables next-view-transitions at the app boundary", () => {
  assert.match(layoutSource, /import \{ ViewTransitions \} from "next-view-transitions"/);
  assert.match(layoutSource, /<ViewTransitions>/);
});
