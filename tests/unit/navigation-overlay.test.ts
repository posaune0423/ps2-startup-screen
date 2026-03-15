import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const navigationOverlaySource = readFileSync(
  new URL("../../src/components/shared/navigation-overlay.tsx", import.meta.url),
  "utf8",
);

test("navigation overlay blocks input without fading through a black screen", () => {
  assert.match(navigationOverlaySource, /background:\s*"transparent"/);
  assert.match(navigationOverlaySource, /window\.requestAnimationFrame\(\(\) => \{\s*router\.push\(href\);/s);
  assert.doesNotMatch(navigationOverlaySource, /window\.setTimeout\(\(\) => \{\s*router\.push\(href\);[\s\S]*FADE_MS/s);
});
