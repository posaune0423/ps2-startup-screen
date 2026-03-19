import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const browserPageSource = readFileSync(
  new URL("../../src/components/screens/browser-screen.tsx", import.meta.url),
  "utf8",
);
const orbRingSource = readFileSync(new URL("../../src/components/browser-menu/orb-ring.tsx", import.meta.url), "utf8");

test("memory pages use full-quality GL settings with demand frameloop", () => {
  assert.match(
    itemGridSource,
    /const GL_PROPS = \{ antialias: true, alpha: true, powerPreference: "high-performance" as const \};/,
  );
  assert.match(itemGridSource, /frameloop="demand"/);
  assert.match(itemGridSource, /gl=\{GL_PROPS\}/);
  assert.match(itemGridSource, /dpr=\{compact \? 1 : 1\.25\}/);
  assert.doesNotMatch(itemGridSource, /background: PS2_BROWSER_BG_FALLBACK/);
  assert.match(itemGridSource, /function MemoryCardImage/);
});

test("browser page uses low-power GL settings with demand frameloop", () => {
  assert.match(browserPageSource, /dpr=\{compact \? 0\.8 : 1\}/);
  assert.match(browserPageSource, /frameloop="demand"/);
  assert.match(
    browserPageSource,
    /const GL_PROPS = \{ antialias: false, alpha: true, powerPreference: "low-power" as const \};/,
  );
  assert.match(browserPageSource, /gl=\{GL_PROPS\}/);
  assert.doesNotMatch(browserPageSource, /background: PS2_BROWSER_BG_FALLBACK/);
});

test("3D pages do not contain explicit GLTF release calls so assets stay cached", () => {
  assert.doesNotMatch(itemGridSource, /releaseGLTFAsset/);
  assert.doesNotMatch(browserPageSource, /releaseGLTFAsset/);
  assert.match(browserPageSource, /modelPath:\s*"\/3d\/icons\/cd\.glb"/);
});

test("browser page includes a dedicated Audio CD entry with its own GLTF asset", () => {
  assert.match(browserPageSource, /href:\s*"\/memory\/music"/);
  assert.match(browserPageSource, /label:\s*"Audio CD"/);
  assert.match(browserPageSource, /modelPath:\s*"\/3d\/icons\/cd\.glb"/);
});

test("browser page moves the Audio CD card onto a second mobile row to avoid overflow", () => {
  assert.match(
    browserPageSource,
    /const MOBILE_CARD_POSITIONS: \[number, number, number\]\[\] = \[\s*\[-0\.34,\s*0\.24,\s*0\],\s*\[0\.34,\s*0\.24,\s*0\],\s*\[0,\s*-0\.28,\s*0\],\s*\];/s,
  );
  assert.match(browserPageSource, /modelScaleMobile: 0\.58,/);
  assert.match(browserPageSource, /function getBrowserCardPositions\(isMobile: boolean\)/);
  assert.match(
    browserPageSource,
    /return isMobile \? MOBILE_CARD_POSITIONS : createHorizontalPositions\(CARDS\.length, 0\.92\);/,
  );
  assert.match(
    browserPageSource,
    /const positions = useMemo\(\(\) => getBrowserCardPositions\(isMobile\), \[isMobile\]\);/,
  );
  assert.match(browserPageSource, /display: compact \? "grid" : "flex"/);
  assert.match(browserPageSource, /gridTemplateColumns: compact \? "repeat\(2, minmax\(0, 1fr\)\)" : undefined/);
  assert.match(browserPageSource, /gridColumn: compact && index === CARDS\.length - 1 \? "1 \/ span 2" : undefined/);
});

test("orb ring switches to a lighter mobile profile on phones", () => {
  assert.match(orbRingSource, /const MOBILE_ORB_COUNT = 5;/);
  assert.match(orbRingSource, /const MOBILE_TRAIL_LENGTH = 10;/);
  assert.match(orbRingSource, /const MOBILE_FRAME_INTERVAL = 1000 \/ 30;/);
  assert.match(orbRingSource, /const MOBILE_MAX_DPR = 0\.75;/);
  assert.match(orbRingSource, /if \(!compact \|\| t < 3\)/);
});
