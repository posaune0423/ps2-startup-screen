import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const layoutSource = readFileSync(new URL("../../src/app/layout.tsx", import.meta.url), "utf8");

test("root layout wraps the app with LanguageProvider", () => {
  assert.match(layoutSource, /import \{ LanguageProvider \} from "\.\.\/lib\/language-context"/);
  assert.match(layoutSource, /<LanguageProvider>[\s\S]*<\/LanguageProvider>/);
});

test("root layout mounts the persistent app shell and back button at the app boundary", () => {
  assert.match(layoutSource, /import AppShell from "\.\.\/components\/shared\/app-shell"/);
  assert.match(layoutSource, /import BackButton from "\.\.\/components\/shared\/back-button"/);
});

test("root layout keeps the app shell and back button inside the language provider without rendering route children", () => {
  assert.match(layoutSource, /<LanguageProvider>\s*<AppShell \/>\s*<BackButton \/>\s*<\/LanguageProvider>/);
  assert.doesNotMatch(layoutSource, /\{children\}/);
});

test("root layout no longer opts into native document view transitions", () => {
  assert.match(layoutSource, /<head>/);
  assert.doesNotMatch(layoutSource, /name="view-transition"/);
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
