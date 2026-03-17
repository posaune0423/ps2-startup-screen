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

test("navigation overlay uses the browser View Transitions API when available and falls back otherwise", () => {
  assert.match(navigationOverlaySource, /interface ViewTransitionCapability/);
  assert.match(
    navigationOverlaySource,
    /startViewTransition\?: \(update: \(\) => Promise<void> \| void\) => ViewTransition;/,
  );
  assert.match(navigationOverlaySource, /typeof doc\.startViewTransition === "function"/);
  assert.match(
    navigationOverlaySource,
    /startViewTransition\(\s*async \(\) =>\s*await new Promise<void>\(\(resolve\) => \{/s,
  );
  assert.match(navigationOverlaySource, /pathResolveRef\.current = resolve;/);
  assert.match(navigationOverlaySource, /if \(!startViewTransition\) \{\s*navigateWithFallback\(href\);/s);
  assert.match(navigationOverlaySource, /paintFrameRef\.current = window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(navigationOverlaySource, /paintSettleFrameRef\.current = window\.requestAnimationFrame\(\(\) => \{/);
});

test("navigation overlay ignores same-path navigations and disables the fallback overlay when native transitions exist", () => {
  assert.match(navigationOverlaySource, /if \(href === pathname\) return;/);
  assert.match(
    navigationOverlaySource,
    /if \(getStartViewTransition\(\)\) \{\s*setVisible\(false\);\s*return \(\) => \{/s,
  );
  assert.match(navigationOverlaySource, /function clearPendingResolve\(\)/);
});
