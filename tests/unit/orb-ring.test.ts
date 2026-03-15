import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const orbRingSource = readFileSync(new URL("../../src/components/browser-menu/orb-ring.tsx", import.meta.url), "utf8");

test("orb ring keeps a longer and slower-fading trail for each light", () => {
  assert.match(orbRingSource, /const TRAIL_LENGTH = 22;/);
  assert.match(orbRingSource, /const TRAIL_FADE = 0\.045;/);
});

test("orb ring draws an additional soft glow layer for each trail point", () => {
  assert.match(orbRingSource, /const glowSize = orbSize \* 2\.25;/);
  assert.match(orbRingSource, /const glowAlpha = baseAlpha \* 0\.48;/);
  assert.match(orbRingSource, /glowGradient\.addColorStop\(0\.65,/);
});
