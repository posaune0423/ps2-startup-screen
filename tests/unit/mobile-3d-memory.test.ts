import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const browserPageSource = readFileSync(new URL("../../src/app/browser/page.tsx", import.meta.url), "utf8");
const orbRingSource = readFileSync(new URL("../../src/components/browser-menu/orb-ring.tsx", import.meta.url), "utf8");

test("memory pages keep sharper model rendering than the browser card picker", () => {
  assert.match(itemGridSource, /dpr=\{compact \? 1 : 1\.5\}/);
  assert.match(
    itemGridSource,
    /const GL_PROPS = \{ antialias: true, alpha: false, powerPreference: "high-performance" as const \};/,
  );
  assert.match(itemGridSource, /gl=\{GL_PROPS\}/);
  assert.match(itemGridSource, /dpr=\{compact \? 1 : 1\.25\}/);
  assert.match(
    itemGridSource,
    /const MEMORY_CARD_ICON_GL = \{ alpha: true, antialias: true, powerPreference: "high-performance" as const \};/,
  );
});

test("browser page also clamps canvas DPR and prefers low-power WebGL settings", () => {
  assert.match(browserPageSource, /dpr=\{compact \? 0\.8 : 1\}/);
  assert.match(
    browserPageSource,
    /const GL_PROPS = \{ antialias: false, alpha: false, powerPreference: "low-power" as const \};/,
  );
  assert.match(browserPageSource, /gl=\{GL_PROPS\}/);
});

test("3D pages release GLTF resources on unmount to avoid cache growth across navigation", () => {
  assert.match(itemGridSource, /releaseGLTFAsset\(modelPath, scene, clearGLTF\)/);
  assert.match(browserPageSource, /releaseGLTFAsset\("\/3d\/memorycard\.glb", scene, clearGLTF\)/);
});

test("orb ring switches to a lighter mobile profile on phones", () => {
  assert.match(orbRingSource, /const MOBILE_ORB_COUNT = 5;/);
  assert.match(orbRingSource, /const MOBILE_TRAIL_LENGTH = 10;/);
  assert.match(orbRingSource, /const MOBILE_FRAME_INTERVAL = 1000 \/ 30;/);
  assert.match(orbRingSource, /const MOBILE_MAX_DPR = 0\.75;/);
  assert.match(orbRingSource, /if \(!compact \|\| t < 3\)/);
});
