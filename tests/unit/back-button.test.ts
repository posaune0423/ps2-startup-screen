import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const backButtonSource = readFileSync(new URL("../../src/components/shared/back-button.tsx", import.meta.url), "utf8");

test("startup route does not map to a global back button", () => {
  assert.doesNotMatch(backButtonSource, /"\/":/);
});

test("button overlay hides during app navigation before reappearing", () => {
  assert.match(backButtonSource, /window\.addEventListener\("app:navigate", hideButton\)/);
  assert.match(backButtonSource, /const BUTTON_REVEAL_MS = 90;/);
  assert.match(backButtonSource, /if \(!mounted \|\| !backHref \|\| isHidden\) return null;/);
});

test("button icons use a tighter circular mask to remove the white rim", () => {
  assert.match(backButtonSource, /style=\{\{ clipPath: "circle\(40%\)" \}\}/);
  assert.doesNotMatch(backButtonSource, /className="overflow-hidden bg-black"/);
});
