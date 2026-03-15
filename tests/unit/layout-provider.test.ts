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

test("root layout loads the Google Analytics gtag script with the shared measurement id", () => {
  assert.match(layoutSource, /import Script from "vinext\/shims\/script"/);
  assert.match(layoutSource, /gaMeasurementId/);
  assert.match(layoutSource, /googletagmanager\.com\/gtag\/js\?id=\$\{gaMeasurementId\}/);
});

test("root layout initializes Google Analytics after hydration", () => {
  assert.match(layoutSource, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.match(layoutSource, /function gtag\(\)\s*\{\s*dataLayer\.push\(arguments\);\s*\}/);
  assert.match(layoutSource, /gtag\("js", new Date\(\)\)/);
  assert.match(layoutSource, /gtag\("config", "\$\{gaMeasurementId\}"\)/);
});
