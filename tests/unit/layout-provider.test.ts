import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const layoutSource = readFileSync(new URL("../../src/app/layout.tsx", import.meta.url), "utf8");

test("root layout wraps the app with LanguageProvider", () => {
  assert.match(layoutSource, /import \{ LanguageProvider \} from "\.\.\/lib\/language-context"/);
  assert.match(layoutSource, /<LanguageProvider>[\s\S]*<\/LanguageProvider>/);
});

test("root layout mounts navigation chrome at the app boundary", () => {
  assert.match(layoutSource, /import NavigationOverlay from "\.\.\/components\/shared\/navigation-overlay"/);
  assert.match(layoutSource, /import BackButton from "\.\.\/components\/shared\/back-button"/);
});

test("root layout keeps navigation overlay and back button inside the language provider", () => {
  assert.match(
    layoutSource,
    /<LanguageProvider>\s*\{children\}\s*<NavigationOverlay \/>\s*<BackButton \/>\s*<\/LanguageProvider>/,
  );
});
